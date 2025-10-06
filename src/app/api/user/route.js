// src/app/api/user/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyApiToken, requireRole, createAuthError, checkRateLimit } from '@/lib/auth'


// Validate environment variables
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error('Missing required Cloudinary environment variables')
}


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})


// GET: return all users OR check by email if provided
export async function GET(req) {
  let user = null


  try {
    checkRateLimit(req)
    user = await verifyApiToken(req)
  } catch (authError) {
    console.error('❌ Authentication error in GET /api/user:', authError.message)
    return createAuthError(authError.message, 401)
  }


  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const getAllUsers = searchParams.get('getAllUsers')


    console.log('🔍 GET /api/user params:', { email, getAllUsers })
    console.log('🔍 Authenticated user:', { email: user.email, role: user.role })


    // Input validation
    if (email && (typeof email !== 'string' || !email.includes('@'))) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }


    const client = await clientPromise
    const db = client.db('VWV')


    if (email) {
      // Users can only check their own email unless admin
      if (user.email !== email && user.role !== 'admin') {
        return createAuthError('Access denied: Cannot check other users', 403)
      }


      const foundUser = await db.collection('user').findOne({ email })
      
      // Create audit log (non-blocking)
      setImmediate(async () => {
        try {
          await db.collection('audit_logs').insertOne({
            action: 'USER_EMAIL_CHECK',
            userId: user.userId,
            userEmail: user.email,
            checkedEmail: email,
            found: !!foundUser,
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
          })
        } catch (auditError) {
          console.error('Audit log error:', auditError)
        }
      })


      return NextResponse.json({ exists: !!foundUser, user: foundUser })
    }


    // Get all users - ADMIN ONLY
    if (getAllUsers === 'true') {
      try {
        requireRole(user, ['admin']) // 🔧 CHANGED: Only admin can get all users
      } catch (roleError) {
        console.error('❌ Role requirement error:', roleError.message)
        return createAuthError(roleError.message, 403)
      }


      console.log('🔍 Fetching all users from database...')


      // 🔧 SAFER APPROACH: Fetch all users and manually filter sensitive fields
      const allUsers = await db
        .collection('user')
        .find({})
        .sort({ createdAt: -1 })
        .toArray()


      console.log('🔍 Raw users found:', allUsers.length)


      // Filter out sensitive fields manually to ensure no sensitive data is returned
      const users = allUsers.map(user => {
        const { 
          password, 
          profilePicturePublicId, 
          ...safeUser 
        } = user
        return safeUser
      })


      console.log('🔍 Filtered users:', users.length)
      console.log('🔍 Sample user structure:', users[0] ? Object.keys(users[0]) : 'No users')


      // Create audit log (non-blocking)
      setImmediate(async () => {
        try {
          await db.collection('audit_logs').insertOne({
            action: 'ALL_USERS_ACCESSED',
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            resultCount: users.length,
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
          })
        } catch (auditError) {
          console.error('Audit log error:', auditError)
        }
      })


      return NextResponse.json({ users })
    }


    // Legacy: return all users (admin only)
    try {
      requireRole(user, ['admin'])
    } catch (roleError) {
      console.error('❌ Admin role requirement error:', roleError.message)
      return createAuthError(roleError.message, 403)
    }


    // Fetch all users and filter sensitive fields
    const allUsers = await db.collection('user').find({}).toArray()
    const users = allUsers.map(user => {
      const { password, profilePicturePublicId, ...safeUser } = user
      return safeUser
    })


    return NextResponse.json(users)
    
  } catch (err) {
    console.error('❌ GET /api/user error:', err)
    console.error('❌ Stack trace:', err.stack)
    return NextResponse.json({ 
      error: 'Failed to fetch user data', 
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }, { status: 500 })
  }
}


// POST: insert user OR update user profile/role/branch based on action parameter
export async function POST(req) {
  try {
    checkRateLimit(req)
    
    const body = await req.json()
    const { action } = body


    console.log('🔍 POST /api/user action:', action)


    // Input validation
    if (!body.email || typeof body.email !== 'string' || !body.email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }


    const client = await clientPromise
    const db = client.db('VWV')


    // Handle profile/role/branch update
    if (action === 'update') {
      let user
      try {
        user = await verifyApiToken(req)
      } catch (authError) {
        return createAuthError(authError.message, 401)
      }


      const { email, name, phone, role, branch, isStockEditor } = body


      // Users can only update their own profile unless admin
      if (user.email !== email && user.role !== 'admin') {
        return createAuthError('Access denied: Cannot update other users', 403)
      }


      // Build update data
      const updateData = {
        updatedAt: new Date(),
        lastUpdatedBy: user.userId
      }


      // Validate and set name
      if (name !== undefined) {
        if (typeof name !== 'string' || name.trim().length < 1) {
          return NextResponse.json({ error: 'Valid name is required' }, { status: 400 })
        }
        updateData.name = name.trim()
      }


      // Validate and set phone
      if (phone !== undefined) {
        if (typeof phone !== 'string') {
          return NextResponse.json({ error: 'Valid phone is required' }, { status: 400 })
        }


        if (phone.trim()) {
          let cleanPhone = phone.replace(/\D/g, '')


          if (cleanPhone.startsWith('880')) {
            cleanPhone = cleanPhone.substring(3)
          }


          if (!/^(\d{11}|\d{10})$/.test(cleanPhone)) {
            return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 })
          }


          if (cleanPhone.length === 10 && !cleanPhone.startsWith('0')) {
            cleanPhone = '0' + cleanPhone
          }


          updateData.phone = cleanPhone
        } else {
          updateData.phone = ''
        }
      }


      // Role updates - admin only
      if (role !== undefined) {
        try {
          requireRole(user, ['admin'])
        } catch (roleError) {
          return createAuthError('Only admins can update user roles', 403)
        }
        
        if (['admin', 'manager', 'moderator', 'cashier', 'viewer', 'user'].includes(role)) {
          updateData.role = role
        } else {
          return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
        }
      }


      // Branch updates - admin only (🔧 CHANGED: Only admin can update branches)
      if (branch !== undefined) {
        try {
          requireRole(user, ['admin'])
        } catch (roleError) {
          return createAuthError('Only admins can update user branches', 403)
        }
        
        updateData.branch = branch ? branch.trim().toLowerCase() : null
      }


      // Stock Editor updates - admin only (🔧 NEW FEATURE)
      if (isStockEditor !== undefined) {
        try {
          requireRole(user, ['admin'])
        } catch (roleError) {
          return createAuthError('Only admins can assign Stock Editor permission', 403)
        }
        
        if (typeof isStockEditor === 'boolean') {
          updateData.isStockEditor = isStockEditor
        } else {
          return NextResponse.json({ error: 'isStockEditor must be a boolean value' }, { status: 400 })
        }
      }


      // Check if user exists
      const existingUser = await db.collection('user').findOne({ email })
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }


      // Update user information
      const updateResult = await db
        .collection('user')
        .updateOne({ email: email }, { $set: updateData })


      if (updateResult.matchedCount === 0) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }


      // Get updated user (filter sensitive fields safely)
      const updatedUserRaw = await db.collection('user').findOne({ email })
      const { password, profilePicturePublicId, ...updatedUser } = updatedUserRaw


      // Create audit log (non-blocking)
      setImmediate(async () => {
        try {
          await db.collection('audit_logs').insertOne({
            action: 'USER_PROFILE_UPDATED',
            userId: user.userId,
            userEmail: user.email,
            targetEmail: email,
            updatedFields: Object.keys(updateData),
            timestamp: new Date(),
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
          })
        } catch (auditError) {
          console.error('Audit log error:', auditError)
        }
      })


      return NextResponse.json({
        message: 'Profile updated successfully',
        user: updatedUser,
      }, { status: 200 })
    }


    // Handle user creation - ALLOW SELF-REGISTRATION OR ADMIN CREATION
    let user = null
    let isAdminCreation = false
    let requiresAuth = false


    try {
      user = await verifyApiToken(req)
      isAdminCreation = user.email !== body.email.toLowerCase()
      requiresAuth = true
    } catch (authError) {
      isAdminCreation = false
      requiresAuth = false
    }


    // Only require admin role if creating for someone else
    if (isAdminCreation && requiresAuth) {
      try {
        requireRole(user, ['admin'])
      } catch (roleError) {
        return createAuthError('Only admins can create accounts for other users', 403)
      }
    }


    const existingUser = await db
      .collection('user')
      .findOne({ email: body.email.toLowerCase() })


    if (existingUser) {
      const { password, profilePicturePublicId, ...safeUser } = existingUser
      return NextResponse.json({ message: 'User already exists', user: safeUser }, { status: 200 })
    }


    // Validate required fields for new user
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 1) {
      return NextResponse.json({ error: 'Valid name is required' }, { status: 400 })
    }


    // Create new user - branch is null by default, admin assigns it later
    const newUser = {
      email: body.email.toLowerCase().trim(),
      name: body.name.trim(),
      phone: body.phone || '',
      role: isAdminCreation && body.role && ['admin', 'manager', 'moderator', 'cashier', 'viewer', 'user'].includes(body.role)
          ? body.role
          : 'user', // Default role for self-registration
      branch: null, // Users start with no branch, admin assigns later
      isStockEditor: false, // 🔧 NEW FEATURE: Default to false, admin assigns later
      profilePicture: body.profilePicture || '',
      firebaseUid: body.firebaseUid || '', // Can be empty, that's fine
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user ? user.userId : 'self-registration'
    }


    const result = await db.collection('user').insertOne(newUser)
    const createdUserRaw = await db.collection('user').findOne({ _id: result.insertedId })
    
    // Filter sensitive fields
    const { password, profilePicturePublicId, ...createdUser } = createdUserRaw


    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        const logData = {
          action: user ? 'USER_CREATED' : 'SELF_REGISTRATION',
          targetEmail: body.email,
          assignedRole: newUser.role,
          assignedBranch: newUser.branch,
          timestamp: new Date(),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
        }


        if (user) {
          logData.userId = user.userId
          logData.userEmail = user.email
        }


        await db.collection('audit_logs').insertOne(logData)
      } catch (auditError) {
        console.error('Audit log error:', auditError)
      }
    })


    return NextResponse.json({ message: 'User created', user: createdUser }, { status: 201 })
    
  } catch (err) {
    console.error('❌ POST /api/user error:', err)
    console.error('❌ Stack trace:', err.stack)
    return NextResponse.json({ 
      error: 'Failed to process user data', 
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }, { status: 500 })
  }
}


// PUT: update user profile picture with Cloudinary upload
export async function PUT(req) {
  let user = null


  try {
    checkRateLimit(req)
    user = await verifyApiToken(req)
  } catch (authError) {
    console.error('❌ Authentication error in PUT /api/user:', authError.message)
    return createAuthError(authError.message, 401)
  }


  try {
    const formData = await req.formData()
    const email = formData.get('email')
    const file = formData.get('file')


    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }


    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }


    // Users can only update their own profile picture unless admin
    if (user.email !== email && user.role !== 'admin') {
      return createAuthError('Access denied: Cannot update other users\' profile pictures', 403)
    }


    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }


    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }


    // Convert file to buffer for Cloudinary upload
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)


    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'image',
            folder: 'vwv_profile_pictures',
            public_id: `user_${email
              .replace('@', '_')
              .replace(/\./g, '_')}_${Date.now()}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill' },
              { quality: 'auto' },
              { format: 'auto' },
            ],
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              reject(new Error(`Cloudinary upload failed: ${error.message}`))
            } else {
              resolve(result)
            }
          }
        )
        .end(buffer)
    })


    // Connect to database
    const client = await clientPromise
    const db = client.db('VWV')


    // Check if user exists
    const existingUser = await db.collection('user').findOne({ email })
    if (!existingUser) {
      // If upload succeeded but user not found, clean up the uploaded image
      try {
        await cloudinary.uploader.destroy(uploadResponse.public_id)
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded image:', cleanupError)
      }
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }


    // Delete old profile picture from Cloudinary if exists
    if (existingUser.profilePicturePublicId) {
      try {
        await cloudinary.uploader.destroy(existingUser.profilePicturePublicId)
      } catch (deleteError) {
        console.error('Error deleting old image:', deleteError)
      }
    }


    // Update user in database with new profile picture URL
    const updateResult = await db.collection('user').updateOne(
      { email: email },
      {
        $set: {
          profilePicture: uploadResponse.secure_url,
          profilePicturePublicId: uploadResponse.public_id,
          updatedAt: new Date(),
          lastUpdatedBy: user.userId
        },
      }
    )


    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }


    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'PROFILE_PICTURE_UPDATED',
          userId: user.userId,
          userEmail: user.email,
          targetEmail: email,
          cloudinaryPublicId: uploadResponse.public_id,
          timestamp: new Date(),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
        })
      } catch (auditError) {
        console.error('Audit log error:', auditError)
      }
    })


    return NextResponse.json({
      message: 'Profile picture updated successfully',
      imageUrl: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    }, { status: 200 })
    
  } catch (err) {
    console.error('❌ Error updating profile picture:', err)
    console.error('❌ Stack trace:', err.stack)
    return NextResponse.json({
      error: 'Failed to update profile picture',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }, { status: 500 })
  }
}


// DELETE: remove user profile picture from Cloudinary and database
export async function DELETE(req) {
  let user = null


  try {
    checkRateLimit(req)
    user = await verifyApiToken(req)
  } catch (authError) {
    console.error('❌ Authentication error in DELETE /api/user:', authError.message)
    return createAuthError(authError.message, 401)
  }


  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')


    // Input validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }


    // Users can only delete their own profile picture unless admin
    if (user.email !== email && user.role !== 'admin') {
      return createAuthError('Access denied: Cannot delete other users\' profile pictures', 403)
    }


    const client = await clientPromise
    const db = client.db('VWV')


    // Get current user to find public_id
    const foundUser = await db.collection('user').findOne({ email })
    if (!foundUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }


    if (!foundUser.profilePicturePublicId) {
      return NextResponse.json({ message: 'No profile picture to delete' }, { status: 200 })
    }


    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(foundUser.profilePicturePublicId)
    } catch (deleteError) {
      console.error('Error deleting from Cloudinary:', deleteError)
    }


    // Remove profile picture fields from database
    const updateResult = await db.collection('user').updateOne(
      { email: email },
      {
        $unset: {
          profilePicture: '',
          profilePicturePublicId: '',
        },
        $set: {
          updatedAt: new Date(),
          lastUpdatedBy: user.userId
        },
      }
    )


    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }


    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'PROFILE_PICTURE_DELETED',
          userId: user.userId,
          userEmail: user.email,
          targetEmail: email,
          deletedPublicId: foundUser.profilePicturePublicId,
          timestamp: new Date(),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
        })
      } catch (auditError) {
        console.error('Audit log error:', auditError)
      }
    })


    return NextResponse.json({ message: 'Profile picture deleted successfully' }, { status: 200 })
    
  } catch (err) {
    console.error('❌ Error deleting profile picture:', err)
    console.error('❌ Stack trace:', err.stack)
    return NextResponse.json({
      error: 'Failed to delete profile picture',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    }, { status: 500 })
  }
}
