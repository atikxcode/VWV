// src/app/api/recommendation/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyApiToken, requireRole, createAuthError } from '@/lib/auth'
import { randomUUID } from 'crypto'

// 🔐 ENTERPRISE SECURITY CONSTANTS
const MAX_TEXT_LENGTH = 200
const MIN_TEXT_LENGTH = 2
const MAX_REQUEST_BODY_SIZE = 50000
const MAX_IMAGE_SIZE = 100 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const REQUEST_TIMEOUT = 30000
const API_VERSION = 'v1'
const MAX_SUB_IMAGES = 10

// Rate limiting per role
const RATE_LIMITS = {
  PUBLIC: { requests: 100, windowMs: 60000 },
  USER: { requests: 200, windowMs: 60000 },
  ADMIN: { requests: 1000, windowMs: 60000 },
  MODERATOR: { requests: 500, windowMs: 60000 },
}

// IP-based tracking
const uploadTracker = new Map()
const requestTracker = new Map()

// Validate environment variables
console.log('🔍 Checking Cloudinary environment variables...')
const cloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
)

if (!cloudinaryConfigured) {
  console.warn('⚠️  Missing Cloudinary environment variables!')
  console.warn('⚠️  Image upload features will be disabled')
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  console.log('✅ Cloudinary configured successfully')
}

// 🔐 ENTERPRISE: Generate request ID
function generateRequestId() {
  return randomUUID()
}

// 🔐 ENTERPRISE: Security headers
function getSecurityHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

// 🔐 ENTERPRISE: Error handling
function handleApiError(error, context = '', requestId = '') {
  console.error(`🚨 [${requestId}] API Error in ${context}:`, error)
  console.error(`🚨 [${requestId}] Error stack:`, error.stack)
  
  const isDevelopment = process.env.NODE_ENV === 'development'

  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? error.message : 'Internal server error',
      context: isDevelopment ? context : undefined,
      requestId,
      timestamp: new Date().toISOString(),
    },
    {
      status: 500,
      headers: getSecurityHeaders(),
    }
  )
}

// 🔐 ENTERPRISE: Request logging
function logRequest(req, method, requestId) {
  const timestamp = new Date().toISOString()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const origin = req.headers.get('origin') || 'unknown'
  
  console.log(`[${requestId}] [${timestamp}] ${method} /api/${API_VERSION}/recommendation`)
  console.log(`[${requestId}] IP: ${ip} | Origin: ${origin}`)
  console.log(`[${requestId}] User-Agent: ${userAgent.substring(0, 100)}`)
}

// 🔐 ENTERPRISE: Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"';()&+${}]/g, '') 
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/alert\(/gi, '')
    .replace(/document\./gi, '')
    .replace(/window\./gi, '')
    .trim()
    .substring(0, 1000)
}

// 🔐 ENTERPRISE: Get user IP
function getUserIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip')?.trim() || 
         'unknown'
}

// 🔐 ENTERPRISE: Rate limiting
function checkRateLimit(ip, role = 'PUBLIC', requestId) {
  const now = Date.now()
  const limit = RATE_LIMITS[role.toUpperCase()] || RATE_LIMITS.PUBLIC
  
  const key = `${ip}:${role}`
  const requests = requestTracker.get(key) || []
  
  const recentRequests = requests.filter(time => now - time < limit.windowMs)
  
  if (recentRequests.length >= limit.requests) {
    const oldestRequest = Math.min(...recentRequests)
    const resetTime = new Date(oldestRequest + limit.windowMs)
    
    console.warn(`[${requestId}] Rate limit exceeded for ${ip} (${role})`)
    throw new Error(`Rate limit exceeded. Try again after ${resetTime.toISOString()}`)
  }
  
  recentRequests.push(now)
  requestTracker.set(key, recentRequests)
  
  if (requestTracker.size > 1000) {
    for (const [k, v] of requestTracker.entries()) {
      if (v.every(time => now - time > 3600000)) {
        requestTracker.delete(k)
      }
    }
  }
}

// 🔐 ENTERPRISE: Upload abuse prevention
function checkUploadAbuse(ip, requestId) {
  const now = Date.now()
  const userUploads = uploadTracker.get(ip) || []
  
  const recentUploads = userUploads.filter(time => now - time < 3600000)
  
  if (recentUploads.length >= 50) {
    console.warn(`[${requestId}] Upload abuse detected for IP: ${ip}`)
    throw new Error('Upload limit exceeded. Maximum 50 uploads per hour.')
  }
  
  recentUploads.push(now)
  uploadTracker.set(ip, recentUploads)
}

// 🔐 ENTERPRISE: Validate file extension
function validateFileExtension(filename, mimeType) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    throw new Error('Invalid file extension')
  }
  
  const mimeToExt = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  }
  
  const allowedExts = mimeToExt[mimeType] || []
  if (!allowedExts.includes(ext)) {
    throw new Error('File extension does not match MIME type')
  }
  
  return true
}

// 🔧 ENTERPRISE: Get user info
async function getUserInfo(req, requestId) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { role: 'public', userId: null, isAuthenticated: false }
    }
    
    const user = await verifyApiToken(req)
    console.log(`[${requestId}] Authenticated user: ${user.userId} (${user.role})`)
    
    return { 
      role: user.role || 'user', 
      userId: user.userId || user.id,
      email: user.email,
      isAuthenticated: true 
    }
  } catch (authError) {
    console.log(`[${requestId}] Authentication failed:`, authError.message)
    return { role: 'public', userId: null, isAuthenticated: false }
  }
}

// 🔍 GET - Fetch recommendation section data
export async function GET(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'GET', requestId)

  try {
    const userInfo = await getUserInfo(req, requestId)
    
    const url = new URL(req.url)
    const includeInactive = url.searchParams.get('includeInactive') === 'true'
    
    // Rate limiting
    try {
      checkRateLimit(ip, userInfo.role, requestId)
    } catch (rateLimitError) {
      return NextResponse.json(
        { success: false, error: rateLimitError.message, requestId },
        { status: 429, headers: getSecurityHeaders() }
      )
    }
    
    const client = await clientPromise
    const db = client.db('VWV')

    const query = { type: 'recommendation' }
    
    if (!includeInactive) {
      query.isActive = true
    }

    const recommendation = await db.collection('homeSettings').findOne(query)

    if (!recommendation) {
      return NextResponse.json({
        success: true,
        recommendation: null,
        message: 'No recommendation section configured',
        requestId
      }, { 
        status: 404,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': includeInactive ? 'no-cache' : 'public, max-age=300'
        }
      })
    }

    const { createdBy, updatedBy, createdByEmail, updatedByEmail, mainImageCloudinaryId, backgroundImageCloudinaryId, __v, ...publicData } = recommendation

    console.log(`[${requestId}] Recommendation fetched - Sub images count: ${publicData.subImages?.length || 0}`)

    return NextResponse.json({
      success: true,
      recommendation: publicData,
      requestId
    }, { 
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        'Cache-Control': includeInactive ? 'no-cache' : 'public, max-age=300'
      }
    })

  } catch (error) {
    return handleApiError(error, 'GET /api/recommendation', requestId)
  }
}

// ➕ POST - Create or update recommendation section (Admin only)
export async function POST(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'POST', requestId)

  try {
    let user
    try {
      user = await verifyApiToken(req)
      console.log(`[${requestId}] JWT verified - User: ${user.userId}, Role: ${user.role}`)
    } catch (authError) {
      console.error(`[${requestId}] JWT verification failed:`, authError.message)
      return createAuthError('Invalid or expired token')
    }

    // Require admin role
    try {
      requireRole(user, ['admin'])
    } catch (roleError) {
      console.warn(`[${requestId}] Access denied - User role: ${user.role}`)
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied. Only admins can manage recommendation section',
          requiredRole: 'admin',
          currentRole: user.role,
          requestId
        },
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    // Rate limiting
    try {
      checkRateLimit(ip, user.role, requestId)
    } catch (rateLimitError) {
      return NextResponse.json(
        { success: false, error: rateLimitError.message, requestId },
        { status: 429, headers: getSecurityHeaders() }
      )
    }
    
    const body = await req.json()

    const bodySize = JSON.stringify(body).length
    if (bodySize > MAX_REQUEST_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Request body too large', requestId },
        { status: 413, headers: getSecurityHeaders() }
      )
    }

    const { headerTitle, headerSubtitle, mainTitle, mainSubtitle, buttonText, buttonLink, isActive } = body

    if (!headerTitle || !mainTitle) {
      return NextResponse.json(
        { success: false, error: 'Header title and main title are required', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Sanitize inputs
    const sanitizedHeaderTitle = sanitizeInput(headerTitle.trim())
    const sanitizedHeaderSubtitle = sanitizeInput((headerSubtitle || '').trim())
    const sanitizedMainTitle = sanitizeInput(mainTitle.trim())
    const sanitizedMainSubtitle = sanitizeInput((mainSubtitle || '').trim())
    const sanitizedButtonText = sanitizeInput((buttonText || 'Explore Now').trim())
    const sanitizedButtonLink = sanitizeInput((buttonLink || '/products').trim())

    if (!sanitizedHeaderTitle || !sanitizedMainTitle) {
      return NextResponse.json(
        { success: false, error: 'Fields cannot be empty after sanitization', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate lengths
    if (sanitizedHeaderTitle.length < MIN_TEXT_LENGTH || sanitizedHeaderTitle.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Header title must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    if (sanitizedMainTitle.length < MIN_TEXT_LENGTH || sanitizedMainTitle.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Main title must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        const recommendationData = {
          type: 'recommendation',
          headerTitle: sanitizedHeaderTitle,
          headerSubtitle: sanitizedHeaderSubtitle,
          mainTitle: sanitizedMainTitle,
          mainSubtitle: sanitizedMainSubtitle,
          buttonText: sanitizedButtonText,
          buttonLink: sanitizedButtonLink,
          isActive: isActive !== false,
          updatedAt: new Date(),
          updatedBy: user.userId,
          updatedByEmail: user.email
        }

        const existingRecommendation = await db.collection('homeSettings').findOne({ type: 'recommendation' }, { session })

        if (existingRecommendation) {
          // Preserve existing images
          if (existingRecommendation.mainImage) {
            recommendationData.mainImage = existingRecommendation.mainImage
            recommendationData.mainImageCloudinaryId = existingRecommendation.mainImageCloudinaryId
          }
          if (existingRecommendation.backgroundImage) {
            recommendationData.backgroundImage = existingRecommendation.backgroundImage
            recommendationData.backgroundImageCloudinaryId = existingRecommendation.backgroundImageCloudinaryId
          }
          if (existingRecommendation.subImages) {
            recommendationData.subImages = existingRecommendation.subImages
          }
          
          await db.collection('homeSettings').updateOne(
            { type: 'recommendation' },
            { $set: recommendationData },
            { session }
          )
          console.log(`[${requestId}] Recommendation updated ✓`)
        } else {
          recommendationData.createdAt = new Date()
          recommendationData.createdBy = user.userId
          recommendationData.createdByEmail = user.email
          recommendationData.mainImage = null
          recommendationData.mainImageCloudinaryId = null
          recommendationData.backgroundImage = null
          recommendationData.backgroundImageCloudinaryId = null
          recommendationData.subImages = []
          
          await db.collection('homeSettings').insertOne(recommendationData, { session })
          console.log(`[${requestId}] Recommendation created ✓`)
        }
      })
    } finally {
      await session.endSession()
    }

    const savedRecommendation = await db.collection('homeSettings').findOne({ type: 'recommendation' })
    const { createdBy, createdByEmail, updatedBy, updatedByEmail, __v, ...publicData } = savedRecommendation

    return NextResponse.json({
      success: true,
      message: 'Recommendation section saved successfully',
      recommendation: publicData,
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'POST /api/recommendation', requestId)
  }
}

// 📤 PUT - Upload images (Admin only)
export async function PUT(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'PUT', requestId)

  try {
    checkUploadAbuse(ip, requestId)
    
    let user
    try {
      user = await verifyApiToken(req)
    } catch (authError) {
      return createAuthError('Invalid or expired token')
    }

    try {
      requireRole(user, ['admin'])
    } catch (roleError) {
      return NextResponse.json(
        { success: false, error: 'Access denied', requestId },
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    if (!cloudinaryConfigured) {
      return NextResponse.json(
        { success: false, error: 'Image upload is not configured', requestId },
        { status: 503, headers: getSecurityHeaders() }
      )
    }

    const formData = await req.formData()
    const file = formData.get('image')
    const imageType = formData.get('imageType') // 'main', 'background', 'sub'
    const subImageIndex = formData.get('subImageIndex')

    console.log(`[${requestId}] 📤 Upload request - Type: ${imageType}, Index: ${subImageIndex}`)

    if (!file || !imageType) {
      return NextResponse.json(
        { success: false, error: 'Image and image type are required', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate file
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    try {
      validateFileExtension(file.name, file.type)
    } catch (validationError) {
      return NextResponse.json(
        { success: false, error: validationError.message, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    if (file.size > MAX_IMAGE_SIZE || file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid file size', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const existingRecommendation = await db.collection('homeSettings').findOne({ type: 'recommendation' })

    if (!existingRecommendation) {
      return NextResponse.json(
        { success: false, error: 'Recommendation section not found. Create data first.', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    console.log(`[${requestId}] 📊 Current subImages:`, JSON.stringify(existingRecommendation.subImages || []))

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine transformation based on image type
    let transformation = []
    let folder = 'vwv/recommendation'
    
    if (imageType === 'main') {
      transformation = [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto:best' },
        { fetch_format: 'auto' }
      ]
      folder += '/main'
    } else if (imageType === 'background') {
      transformation = [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
      folder += '/background'
    } else if (imageType === 'sub') {
      transformation = [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
      folder += '/sub'
    }

    let uploadResponse
    try {
      console.log(`[${requestId}] ☁️  Uploading to Cloudinary...`)
      uploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: folder,
            public_id: `${imageType}_${subImageIndex !== null ? `idx${subImageIndex}_` : ''}${Date.now()}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation,
            timeout: 60000,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(buffer)
      })
      console.log(`[${requestId}] ✅ Cloudinary upload success: ${uploadResponse.secure_url}`)
    } catch (uploadError) {
      console.error(`[${requestId}] ❌ Cloudinary upload failed:`, uploadError)
      return NextResponse.json(
        { success: false, error: 'Image upload failed', details: uploadError.message, requestId },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Transaction for atomicity
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        if (imageType === 'main') {
          await db.collection('homeSettings').updateOne(
            { type: 'recommendation' },
            {
              $set: {
                mainImage: uploadResponse.secure_url,
                mainImageCloudinaryId: uploadResponse.public_id,
                updatedAt: new Date(),
                updatedBy: user.userId
              }
            },
            { session }
          )
          
          // Delete old image
          if (existingRecommendation.mainImageCloudinaryId) {
            try {
              await cloudinary.uploader.destroy(existingRecommendation.mainImageCloudinaryId)
              console.log(`[${requestId}] 🗑️  Deleted old main image`)
            } catch (err) {
              console.error(`[${requestId}] Error deleting old main image:`, err)
            }
          }
        } else if (imageType === 'background') {
          await db.collection('homeSettings').updateOne(
            { type: 'recommendation' },
            {
              $set: {
                backgroundImage: uploadResponse.secure_url,
                backgroundImageCloudinaryId: uploadResponse.public_id,
                updatedAt: new Date(),
                updatedBy: user.userId
              }
            },
            { session }
          )
          
          // Delete old image
          if (existingRecommendation.backgroundImageCloudinaryId) {
            try {
              await cloudinary.uploader.destroy(existingRecommendation.backgroundImageCloudinaryId)
              console.log(`[${requestId}] 🗑️  Deleted old background image`)
            } catch (err) {
              console.error(`[${requestId}] Error deleting old background image:`, err)
            }
          }
        } else if (imageType === 'sub' && subImageIndex !== null) {
          const index = parseInt(subImageIndex)
          
          console.log(`[${requestId}] 🔧 Processing sub-image at index ${index}`)
          
          // Get existing sub-images array or initialize empty array
          let subImages = Array.isArray(existingRecommendation.subImages) 
            ? [...existingRecommendation.subImages]  // Clone the array
            : []
          
          console.log(`[${requestId}] 📊 Current array length: ${subImages.length}`)
          
          // Delete old sub-image at this index if it exists
          if (subImages[index] && subImages[index].cloudinaryId) {
            try {
              await cloudinary.uploader.destroy(subImages[index].cloudinaryId)
              console.log(`[${requestId}] 🗑️  Deleted old sub-image at index ${index}`)
            } catch (err) {
              console.error(`[${requestId}] Error deleting old sub-image:`, err)
            }
          }
          
          // **FIX: Ensure array has enough length before assigning**
          // Fill gaps with null if necessary
          while (subImages.length <= index) {
            subImages.push(null)
          }
          
          // Now assign the new image at the specific index
          subImages[index] = {
            url: uploadResponse.secure_url,
            cloudinaryId: uploadResponse.public_id,
            alt: `Sub image ${index + 1}`,
            order: index,
          }
          
          // Remove any null entries to clean up the array
          subImages = subImages.filter(img => img !== null)
          
          console.log(`[${requestId}] 💾 Saving subImages array:`, JSON.stringify(subImages))
          console.log(`[${requestId}] 📏 New array length: ${subImages.length}`)
          
          // Update the database with the new subImages array
          const updateResult = await db.collection('homeSettings').updateOne(
            { type: 'recommendation' },
            {
              $set: {
                subImages: subImages,
                updatedAt: new Date(),
                updatedBy: user.userId
              }
            },
            { session }
          )
          
          console.log(`[${requestId}] ✅ Database update result - Modified: ${updateResult.modifiedCount}`)
        }
      })
      
      console.log(`[${requestId}] ✅ Transaction completed successfully`)
      
    } catch (dbError) {
      console.error(`[${requestId}] ❌ Database transaction failed:`, dbError)
      // Rollback: Delete uploaded image if DB update fails
      try {
        await cloudinary.uploader.destroy(uploadResponse.public_id)
        console.log(`[${requestId}] 🔄 Rolled back uploaded image`)
      } catch (cleanupError) {
        console.error(`[${requestId}] Error rolling back image:`, cleanupError)
      }
      throw dbError
    } finally {
      await session.endSession()
    }

    console.log(`[${requestId}] 🎉 Image uploaded successfully ✓`)

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: uploadResponse.secure_url,
      cloudinaryId: uploadResponse.public_id,
      imageType,
      subImageIndex: subImageIndex !== null ? parseInt(subImageIndex) : null,
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'PUT /api/recommendation', requestId)
  }
}

// 🗑️ DELETE - Delete images or toggle status (Admin only)
export async function DELETE(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'DELETE', requestId)

  try {
    let user
    try {
      user = await verifyApiToken(req)
    } catch (authError) {
      return createAuthError('Invalid or expired token')
    }

    try {
      requireRole(user, ['admin'])
    } catch (roleError) {
      return NextResponse.json(
        { success: false, error: 'Access denied', requestId },
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const imageType = url.searchParams.get('imageType')
    const subImageIndex = url.searchParams.get('subImageIndex')

    console.log(`[${requestId}] 🗑️  DELETE request - Action: ${action}, Type: ${imageType}, Index: ${subImageIndex}`)

    const client = await clientPromise
    const db = client.db('VWV')

    const recommendation = await db.collection('homeSettings').findOne({ type: 'recommendation' })

    if (!recommendation) {
      return NextResponse.json(
        { success: false, error: 'Recommendation section not found', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    // TOGGLE ACTIVE STATUS
    if (action === 'toggle') {
      await db.collection('homeSettings').updateOne(
        { type: 'recommendation' },
        { 
          $set: { 
            isActive: !recommendation.isActive,
            updatedAt: new Date(),
            updatedBy: user.userId
          } 
        }
      )

      console.log(`[${requestId}] Recommendation toggled ✓`)

      return NextResponse.json({
        success: true,
        message: `Recommendation section ${recommendation.isActive ? 'deactivated' : 'activated'}`,
        isActive: !recommendation.isActive,
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    // DELETE IMAGE
    if (action === 'deleteImage') {
      let cloudinaryId = null

      if (imageType === 'main') {
        cloudinaryId = recommendation.mainImageCloudinaryId
        await db.collection('homeSettings').updateOne(
          { type: 'recommendation' },
          { 
            $set: { 
              mainImage: null,
              mainImageCloudinaryId: null,
              updatedAt: new Date(),
              updatedBy: user.userId
            } 
          }
        )
        console.log(`[${requestId}] Main image removed ✓`)
      } else if (imageType === 'background') {
        cloudinaryId = recommendation.backgroundImageCloudinaryId
        await db.collection('homeSettings').updateOne(
          { type: 'recommendation' },
          { 
            $set: { 
              backgroundImage: null,
              backgroundImageCloudinaryId: null,
              updatedAt: new Date(),
              updatedBy: user.userId
            } 
          }
        )
        console.log(`[${requestId}] Background image removed ✓`)
      } else if (imageType === 'sub' && subImageIndex !== null) {
        const index = parseInt(subImageIndex)
        console.log(`[${requestId}] Deleting sub-image at index ${index}`)
        
        if (Array.isArray(recommendation.subImages) && recommendation.subImages[index]) {
          cloudinaryId = recommendation.subImages[index].cloudinaryId
          
          // Create new array without the deleted image
          const subImages = recommendation.subImages.filter((img, idx) => idx !== index)
          
          await db.collection('homeSettings').updateOne(
            { type: 'recommendation' },
            { 
              $set: { 
                subImages,
                updatedAt: new Date(),
                updatedBy: user.userId
              }
            }
          )
          console.log(`[${requestId}] Sub-image removed - Remaining: ${subImages.length}`)
        }
      }

      // Delete from Cloudinary
      if (cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(cloudinaryId)
          console.log(`[${requestId}] 🗑️  Deleted from Cloudinary: ${cloudinaryId}`)
        } catch (err) {
          console.error(`[${requestId}] Error deleting from Cloudinary:`, err)
        }
      }

      console.log(`[${requestId}] Image deleted ✓`)

      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully',
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action', requestId },
      { status: 400, headers: getSecurityHeaders() }
    )

  } catch (error) {
    return handleApiError(error, 'DELETE /api/recommendation', requestId)
  }
}

// 🔒 OPTIONS - CORS preflight
export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
