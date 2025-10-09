// src/app/api/slider/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyApiToken, requireRole, createAuthError } from '@/lib/auth'
import { randomUUID } from 'crypto'

// 🔐 ENTERPRISE SECURITY CONSTANTS
const MAX_TEXT_LENGTH = 200
const MIN_TEXT_LENGTH = 2
const MAX_DESCRIPTION_LENGTH = 500
const MAX_REQUEST_BODY_SIZE = 50000 // 50KB
const MAX_IMAGE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const REQUEST_TIMEOUT = 30000 // 30 seconds
const API_VERSION = 'v1'
const MAX_SLIDES = 20

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

// 🔐 ENTERPRISE: Generate request ID for tracing
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

// 🔐 ENTERPRISE: Enhanced error handling with request ID
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

// 🔐 ENTERPRISE: Enhanced request logging
function logRequest(req, method, requestId) {
  const timestamp = new Date().toISOString()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const origin = req.headers.get('origin') || 'unknown'
  
  console.log(`[${requestId}] [${timestamp}] ${method} /api/${API_VERSION}/slider`)
  console.log(`[${requestId}] IP: ${ip} | Origin: ${origin}`)
  console.log(`[${requestId}] User-Agent: ${userAgent.substring(0, 100)}`)
}

// 🔐 ENTERPRISE: Advanced input sanitization
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

// 🔍 GET - Fetch all slides or single slide by ID
export async function GET(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'GET', requestId)

  try {
    const userInfo = await getUserInfo(req, requestId)
    
    const url = new URL(req.url)
    const slideId = url.searchParams.get('id')
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

    // Fetch single slide by ID
    if (slideId) {
      const slide = await db.collection('sliders').findOne({ id: slideId })
      
      if (!slide) {
        return NextResponse.json(
          { success: false, error: 'Slide not found', requestId },
          { status: 404, headers: getSecurityHeaders() }
        )
      }

      if (!slide.isActive && !includeInactive) {
        return NextResponse.json(
          { success: false, error: 'Slide not available', requestId },
          { status: 404, headers: getSecurityHeaders() }
        )
      }

      const { createdBy, updatedBy, createdByEmail, updatedByEmail, cloudinaryId, __v, ...publicData } = slide

      return NextResponse.json({
        success: true,
        slide: publicData,
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    // Fetch all slides
    const query = includeInactive ? {} : { isActive: true }
    const slides = await db.collection('sliders')
      .find(query)
      .sort({ order: 1 })
      .toArray()

    const publicSlides = slides.map(slide => {
      const { createdBy, updatedBy, createdByEmail, updatedByEmail, cloudinaryId, __v, ...publicData } = slide
      return publicData
    })

    return NextResponse.json({
      success: true,
      slides: publicSlides,
      total: publicSlides.length,
      requestId
    }, { 
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        'Cache-Control': includeInactive ? 'no-cache' : 'public, max-age=300'
      }
    })

  } catch (error) {
    return handleApiError(error, 'GET /api/slider', requestId)
  }
}

// ➕ POST - Create or update slide (Admin only)
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
          error: 'Access denied. Only admins can manage sliders',
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

    const { action, slideData, id, slides } = body

    const client = await clientPromise
    const db = client.db('VWV')

    // CREATE NEW SLIDE
    if (action === 'create') {
      const slideCount = await db.collection('sliders').countDocuments()
      
      if (slideCount >= MAX_SLIDES) {
        return NextResponse.json(
          { success: false, error: `Maximum ${MAX_SLIDES} slides allowed`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      if (!slideData || !slideData.title || !slideData.subtitle) {
        return NextResponse.json(
          { success: false, error: 'Title and subtitle are required', requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      // Sanitize inputs
      const sanitizedSlide = {
        id: sanitizeInput(slideData.id || `slide-${Date.now()}`),
        image: sanitizeInput(slideData.image || ''),
        cloudinaryId: slideData.cloudinaryId || null,
        alt: sanitizeInput(slideData.alt || ''),
        title: sanitizeInput(slideData.title.trim()),
        subtitle: sanitizeInput(slideData.subtitle.trim()),
        description: sanitizeInput(slideData.description || ''),
        buttonText: sanitizeInput(slideData.buttonText || 'Explore'),
        alignment: ['left', 'center', 'right'].includes(slideData.alignment) ? slideData.alignment : 'center',
        isActive: slideData.isActive !== false,
        order: slideCount,
        createdAt: new Date(),
        createdBy: user.userId,
        createdByEmail: user.email,
        updatedAt: new Date(),
        updatedBy: user.userId,
        updatedByEmail: user.email
      }

      // Validate lengths
      if (sanitizedSlide.title.length < MIN_TEXT_LENGTH || sanitizedSlide.title.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { success: false, error: `Title must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      if (sanitizedSlide.subtitle.length < MIN_TEXT_LENGTH || sanitizedSlide.subtitle.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { success: false, error: `Subtitle must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      if (sanitizedSlide.description && sanitizedSlide.description.length > MAX_DESCRIPTION_LENGTH) {
        return NextResponse.json(
          { success: false, error: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      await db.collection('sliders').insertOne(sanitizedSlide)

      console.log(`[${requestId}] Slide created ✓`)

      const { createdBy, createdByEmail, updatedBy, updatedByEmail, __v, ...publicData } = sanitizedSlide

      return NextResponse.json({
        success: true,
        message: 'Slide created successfully',
        slide: publicData,
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    // UPDATE EXISTING SLIDE
    if (action === 'update') {
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Slide ID is required', requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      const existingSlide = await db.collection('sliders').findOne({ id })
      
      if (!existingSlide) {
        return NextResponse.json(
          { success: false, error: 'Slide not found', requestId },
          { status: 404, headers: getSecurityHeaders() }
        )
      }

      if (!slideData || !slideData.title || !slideData.subtitle) {
        return NextResponse.json(
          { success: false, error: 'Title and subtitle are required', requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      // Sanitize inputs
      const sanitizedSlide = {
        title: sanitizeInput(slideData.title.trim()),
        subtitle: sanitizeInput(slideData.subtitle.trim()),
        description: sanitizeInput(slideData.description || ''),
        buttonText: sanitizeInput(slideData.buttonText || 'Explore'),
        alt: sanitizeInput(slideData.alt || ''),
        alignment: ['left', 'center', 'right'].includes(slideData.alignment) ? slideData.alignment : 'center',
        isActive: slideData.isActive !== false,
        updatedAt: new Date(),
        updatedBy: user.userId,
        updatedByEmail: user.email
      }

      // Validate lengths
      if (sanitizedSlide.title.length < MIN_TEXT_LENGTH || sanitizedSlide.title.length > MAX_TEXT_LENGTH) {
        return NextResponse.json(
          { success: false, error: `Title must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      // Preserve image if not changed
      if (existingSlide.image) {
        sanitizedSlide.image = existingSlide.image
        sanitizedSlide.cloudinaryId = existingSlide.cloudinaryId
      }

      await db.collection('sliders').updateOne(
        { id },
        { $set: sanitizedSlide }
      )

      console.log(`[${requestId}] Slide updated ✓`)

      const updatedSlide = await db.collection('sliders').findOne({ id })
      const { createdBy, createdByEmail, updatedBy, updatedByEmail, cloudinaryId, __v, ...publicData } = updatedSlide

      return NextResponse.json({
        success: true,
        message: 'Slide updated successfully',
        slide: publicData,
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    // REORDER SLIDES
    if (action === 'reorder') {
      if (!Array.isArray(slides) || slides.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid slides array', requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      const session = client.startSession()
      
      try {
        await session.withTransaction(async () => {
          for (const slide of slides) {
            await db.collection('sliders').updateOne(
              { id: slide.id },
              { $set: { order: slide.order, updatedAt: new Date() } },
              { session }
            )
          }
        })
      } finally {
        await session.endSession()
      }

      console.log(`[${requestId}] Slides reordered ✓`)

      return NextResponse.json({
        success: true,
        message: 'Slides reordered successfully',
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action', requestId },
      { status: 400, headers: getSecurityHeaders() }
    )

  } catch (error) {
    return handleApiError(error, 'POST /api/slider', requestId)
  }
}

// 📤 PUT - Upload slide image (Admin only)
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
    const slideId = formData.get('slideId')

    if (!file || !slideId) {
      return NextResponse.json(
        { success: false, error: 'Image and slide ID are required', requestId },
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

    const existingSlide = await db.collection('sliders').findOne({ id: slideId })

    if (!existingSlide) {
      return NextResponse.json(
        { success: false, error: 'Slide not found. Create slide data first.', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    let uploadResponse
    try {
      uploadResponse = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'vwv/sliders',
            public_id: `slider_${slideId}_${Date.now()}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
              { width: 1920, height: 1080, crop: 'limit' },
              { quality: 'auto:best' },
              { fetch_format: 'auto' }
            ],
            timeout: 60000,
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        )
        uploadStream.end(buffer)
      })
    } catch (uploadError) {
      console.error(`[${requestId}] Cloudinary upload failed:`, uploadError)
      return NextResponse.json(
        { success: false, error: 'Image upload failed', requestId },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Transaction for atomicity
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        await db.collection('sliders').updateOne(
          { id: slideId },
          {
            $set: {
              image: uploadResponse.secure_url,
              cloudinaryId: uploadResponse.public_id,
              updatedAt: new Date(),
              updatedBy: user.userId
            }
          },
          { session }
        )
      })
      
      // Delete old image after successful DB update
      if (existingSlide.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(existingSlide.cloudinaryId)
        } catch (err) {
          console.error(`[${requestId}] Error deleting old image:`, err)
        }
      }
      
    } catch (dbError) {
      // Rollback: Delete uploaded image if DB update fails
      try {
        await cloudinary.uploader.destroy(uploadResponse.public_id)
        console.log(`[${requestId}] Rolled back uploaded image`)
      } catch (cleanupError) {
        console.error(`[${requestId}] Error rolling back image:`, cleanupError)
      }
      throw dbError
    } finally {
      await session.endSession()
    }

    console.log(`[${requestId}] Image uploaded ✓`)

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl: uploadResponse.secure_url,
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'PUT /api/slider', requestId)
  }
}

// 🗑️ DELETE - Delete slide or toggle active status (Admin only)
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
    const slideId = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    if (!slideId) {
      return NextResponse.json(
        { success: false, error: 'Slide ID is required', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const slide = await db.collection('sliders').findOne({ id: slideId })

    if (!slide) {
      return NextResponse.json(
        { success: false, error: 'Slide not found', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    // TOGGLE ACTIVE STATUS
    if (action === 'toggle') {
      await db.collection('sliders').updateOne(
        { id: slideId },
        { 
          $set: { 
            isActive: !slide.isActive,
            updatedAt: new Date(),
            updatedBy: user.userId
          } 
        }
      )

      console.log(`[${requestId}] Slide toggled ✓`)

      return NextResponse.json({
        success: true,
        message: `Slide ${slide.isActive ? 'deactivated' : 'activated'} successfully`,
        isActive: !slide.isActive,
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    // DELETE SLIDE PERMANENTLY
    if (action === 'delete') {
      // Delete from DB first
      await db.collection('sliders').deleteOne({ id: slideId })

      // Then delete image
      if (slide.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(slide.cloudinaryId)
        } catch (err) {
          console.error(`[${requestId}] Error deleting image:`, err)
        }
      }

      console.log(`[${requestId}] Slide deleted ✓`)

      return NextResponse.json({
        success: true,
        message: 'Slide deleted successfully',
        requestId
      }, { status: 200, headers: getSecurityHeaders() })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action', requestId },
      { status: 400, headers: getSecurityHeaders() }
    )

  } catch (error) {
    return handleApiError(error, 'DELETE /api/slider', requestId)
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
