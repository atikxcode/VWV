// src/app/api/user/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

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
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')
    const getAllUsers = searchParams.get('getAllUsers') // 👈 NEW: For admin user management

    const client = await clientPromise
    const db = client.db('VWV')

    if (email) {
      const user = await db.collection('user').findOne({ email })
      return NextResponse.json({ exists: !!user, user })
    }

    // 👇 NEW: Get all users with role and branch info for admin
    if (getAllUsers === 'true') {
      const users = await db
        .collection('user')
        .find(
          {},
          {
            projection: {
              email: 1,
              name: 1,
              phone: 1,
              role: 1,
              branch: 1,
              profilePicture: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          }
        )
        .sort({ createdAt: -1 })
        .toArray()

      return NextResponse.json({ users })
    }

    // return all users if no email provided (legacy)
    const users = await db.collection('user').find().toArray()
    return NextResponse.json(users)
  } catch (err) {
    console.error('GET /api/user error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: insert user OR update user profile/role/branch based on action parameter
export async function POST(req) {
  try {
    const body = await req.json()
    const { action } = body

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // 👇 ENHANCED: Handle profile/role/branch update
    if (action === 'update') {
      const { email, name, phone, role, branch, updaterEmail } = body

      // Basic validation
      if (!name || !phone) {
        return NextResponse.json(
          { error: 'Name and phone are required' },
          { status: 400 }
        )
      }

      // Enhanced phone validation
      let cleanPhone = phone.replace(/\D/g, '')

      if (cleanPhone.startsWith('880')) {
        cleanPhone = cleanPhone.substring(3)
      }

      if (!/^(\d{11}|\d{10})$/.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }

      if (cleanPhone.length === 10 && !cleanPhone.startsWith('0')) {
        cleanPhone = '0' + cleanPhone
      }

      // Check if user exists
      const existingUser = await db.collection('user').findOne({ email })
      if (!existingUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Build update data
      const updateData = {
        name: name.trim(),
        phone: cleanPhone,
        updatedAt: new Date(),
      }

      // 🔐 IMPORTANT: Role and branch updates (should be admin-only in production)
      // Add authorization check here to ensure only admins can update roles
      if (role && ['admin', 'moderator', 'user'].includes(role)) {
        updateData.role = role
      }

      if (branch !== undefined) {
        // Allow setting branch to null or a valid string
        updateData.branch = branch ? branch.trim().toLowerCase() : null
      }

      // Update user information
      const updateResult = await db
        .collection('user')
        .updateOne({ email: email }, { $set: updateData })

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        )
      }

      // Get updated user
      const updatedUser = await db.collection('user').findOne({ email })

      return NextResponse.json(
        {
          message: 'Profile updated successfully',
          user: updatedUser,
        },
        { status: 200 }
      )
    }

    // 👇 ENHANCED: Handle user creation with role and branch
    const existingUser = await db
      .collection('user')
      .findOne({ email: body.email })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: existingUser },
        { status: 200 }
      )
    }

    // Create new user with role and branch
    const newUser = {
      ...body,
      role:
        body.role && ['admin', 'moderator', 'user'].includes(body.role)
          ? body.role
          : 'user', // Default to 'user'
      branch: body.branch ? body.branch.trim().toLowerCase() : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('user').insertOne(newUser)
    const createdUser = await db
      .collection('user')
      .findOne({ _id: result.insertedId })

    return NextResponse.json(
      { message: 'User created', user: createdUser },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/user error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT: update user profile picture with Cloudinary upload
export async function PUT(req) {
  try {
    const formData = await req.formData()
    const email = formData.get('email')
    const file = formData.get('file')

    if (!email || !file) {
      return NextResponse.json(
        { error: 'Email and file are required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
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
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Profile picture updated successfully',
        imageUrl: uploadResponse.secure_url,
        publicId: uploadResponse.public_id,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error updating profile picture:', err)
    return NextResponse.json(
      {
        error: 'Failed to update profile picture',
        details: err.message,
      },
      { status: 500 }
    )
  }
}

// DELETE: remove user profile picture from Cloudinary and database
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Get current user to find public_id
    const user = await db.collection('user').findOne({ email })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.profilePicturePublicId) {
      return NextResponse.json(
        { message: 'No profile picture to delete' },
        { status: 200 }
      )
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(user.profilePicturePublicId)
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
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Profile picture deleted successfully',
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error deleting profile picture:', err)
    return NextResponse.json(
      {
        error: 'Failed to delete profile picture',
        details: err.message,
      },
      { status: 500 }
    )
  }
}
