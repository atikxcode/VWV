// src/app/api/offer-popup/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyApiToken, requireRole, createAuthError } from '@/lib/auth'
import { randomUUID } from 'crypto'

// 🔐 ENTERPRISE SECURITY CONSTANTS
const MAX_TEXT_LENGTH = 200
const MIN_TEXT_LENGTH = 2
const MAX_REQUEST_BODY_SIZE = 50000 // 50KB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']
const REQUEST_TIMEOUT = 30000 // 30 seconds
const API_VERSION = 'v1'

// Rate limiting per role
const RATE_LIMITS = {
  PUBLIC: { requests: 100, windowMs: 60000 },
  USER: { requests: 200, windowMs: 60000 },
  ADMIN: { requests: 1000, windowMs: 60000 },
  MODERATOR: { requests: 500, windowMs: 60000 },
}

// IP-based upload tracking (should use Redis in production)
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
  
  console.log(`[${requestId}] [${timestamp}] ${method} /api/${API_VERSION}/offer-popup`)
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

// 🔐 ENTERPRISE: MongoDB injection prevention
function sanitizeMongoQuery(query) {
  if (typeof query !== 'object' || query === null) return query
  
  const sanitized = {}
  for (const key in query) {
    // Prevent MongoDB operators in user input
    if (key.startsWith('$')) continue
    
    const value = query[key]
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

// 🔐 ENTERPRISE: Get user IP
function getUserIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip')?.trim() || 
         'unknown'
}

// 🔐 ENTERPRISE: Rate limiting with exponential backoff
function checkRateLimit(ip, role = 'PUBLIC', requestId) {
  const now = Date.now()
  const limit = RATE_LIMITS[role.toUpperCase()] || RATE_LIMITS.PUBLIC
  
  const key = `${ip}:${role}`
  const requests = requestTracker.get(key) || []
  
  // Clean old requests
  const recentRequests = requests.filter(time => now - time < limit.windowMs)
  
  if (recentRequests.length >= limit.requests) {
    const oldestRequest = Math.min(...recentRequests)
    const resetTime = new Date(oldestRequest + limit.windowMs)
    
    console.warn(`[${requestId}] Rate limit exceeded for ${ip} (${role})`)
    
    throw new Error(`Rate limit exceeded. Try again after ${resetTime.toISOString()}`)
  }
  
  recentRequests.push(now)
  requestTracker.set(key, recentRequests)
  
  // Cleanup old entries every 1000 requests
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
  
  const recentUploads = userUploads.filter(time => now - time < 3600000) // 1 hour
  
  if (recentUploads.length >= 20) {
    console.warn(`[${requestId}] Upload abuse detected for IP: ${ip}`)
    throw new Error('Upload limit exceeded. Maximum 20 uploads per hour.')
  }
  
  recentUploads.push(now)
  uploadTracker.set(ip, recentUploads)
}

// 🔐 ENTERPRISE: Validate file extension matches MIME type
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

// 🔐 ENTERPRISE: Sanitize filename
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unnamed-file'
  
  let sanitized = filename
    .replace(/[<>"'%;()&+${}]/g, '')
    .replace(/[/\\?*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/\.{2,}/g, '_') // Prevent directory traversal
    .replace(/_{2,}/g, '_')
    .trim()
  
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = 255 - extension.length - 1
    
    if (maxNameLength > 0) {
      sanitized = nameWithoutExt.substring(0, maxNameLength) + '.' + extension
    } else {
      sanitized = sanitized.substring(0, 255)
    }
  }
  
  return sanitized
}

// 🔧 ENTERPRISE: Get user info with JWT verification
async function getUserInfo(req, requestId) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { role: 'public', branch: null, userId: null, isAuthenticated: false }
    }
    
    const user = await verifyApiToken(req)
    console.log(`[${requestId}] Authenticated user: ${user.userId} (${user.role})`)
    
    return { 
      role: user.role || 'user', 
      branch: user.branch || null, 
      userId: user.userId || user.id,
      email: user.email,
      isAuthenticated: true 
    }
  } catch (authError) {
    console.log(`[${requestId}] Authentication failed:`, authError.message)
    return { role: 'public', branch: null, userId: null, isAuthenticated: false }
  }
}


export async function GET(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'GET', requestId)

  try {
    const userInfo = await getUserInfo(req, requestId)
    
    // Check if this is an admin request
    const url = new URL(req.url)
    const isAdminRequest = url.searchParams.get('admin') === 'true'
    
    // Rate limiting
    try {
      checkRateLimit(ip, userInfo.role, requestId)
    } catch (rateLimitError) {
      return NextResponse.json(
        { 
          success: false, 
          error: rateLimitError.message,
          requestId
        },
        { status: 429, headers: getSecurityHeaders() }
      )
    }
    
    const client = await clientPromise
    const db = client.db('VWV')

    // Build query based on request type
    const query = { type: 'offerPopup' }
    
    // Only filter by isActive for public requests
    if (!isAdminRequest) {
      query.isActive = true
    }

    const popupDoc = await db
      .collection('settings')
      .findOne(query)

    if (!popupDoc) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No popup found',
          data: null,
          requestId
        },
        {
          status: 404,
          headers: {
            ...getSecurityHeaders(),
            'Cache-Control': isAdminRequest ? 'no-cache' : 'public, max-age=300'
          },
        }
      )
    }

    // Remove sensitive fields
    const { createdBy, updatedBy, createdByEmail, updatedByEmail, imagePublicId, __v, ...publicData } = popupDoc

    return NextResponse.json(
      { 
        success: true,
        data: publicData,
        requestId
      },
      {
        status: 200,
        headers: {
          ...getSecurityHeaders(),
          'Cache-Control': isAdminRequest ? 'no-cache' : 'public, max-age=300'
        },
      }
    )
  } catch (error) {
    return handleApiError(error, 'GET /api/offer-popup', requestId)
  }
}


// 🔥 POST - Admin only: Create or update popup
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
          error: 'Access denied. Only admins can manage offer popup',
          requiredRole: 'admin',
          currentRole: user.role,
          requestId
        },
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    // Rate limiting for admin
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

    const { headline, title, subtitle, isActive, displayRules } = body

    if (!headline || !title || !subtitle) {
      return NextResponse.json(
        { success: false, error: 'All fields (headline, title, subtitle) are required', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Sanitize inputs
    const sanitizedHeadline = sanitizeInput(headline.trim())
    const sanitizedTitle = sanitizeInput(title.trim())
    const sanitizedSubtitle = sanitizeInput(subtitle.trim())

    if (!sanitizedHeadline || !sanitizedTitle || !sanitizedSubtitle) {
      return NextResponse.json(
        { success: false, error: 'Fields cannot be empty after sanitization', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate lengths
    if (sanitizedHeadline.length < MIN_TEXT_LENGTH || sanitizedHeadline.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Headline must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    if (sanitizedTitle.length < MIN_TEXT_LENGTH || sanitizedTitle.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Title must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    if (sanitizedSubtitle.length < MIN_TEXT_LENGTH || sanitizedSubtitle.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Subtitle must be between ${MIN_TEXT_LENGTH} and ${MAX_TEXT_LENGTH} characters`, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate display rules
    let validatedDisplayRules = {
      triggerType: 'scroll',
      delaySeconds: 0,
      showOnce: true
    }

    if (displayRules) {
      const allowedTriggers = ['scroll', 'time', 'immediate', 'exit']
      if (displayRules.triggerType && !allowedTriggers.includes(displayRules.triggerType)) {
        return NextResponse.json(
          { success: false, error: `Invalid trigger type. Allowed: ${allowedTriggers.join(', ')}`, requestId },
          { status: 400, headers: getSecurityHeaders() }
        )
      }

      validatedDisplayRules = {
        triggerType: displayRules.triggerType || 'scroll',
        delaySeconds: typeof displayRules.delaySeconds === 'number' ? 
          Math.max(0, Math.min(displayRules.delaySeconds, 300)) : 0,
        showOnce: displayRules.showOnce !== false
      }
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Use transaction for atomicity
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        // If setting to active, deactivate all others
        if (isActive) {
          await db.collection('settings').updateMany(
            { type: 'offerPopup' },
            { $set: { isActive: false } },
            { session }
          )
        }

        const popupData = {
          type: 'offerPopup',
          headline: sanitizedHeadline,
          title: sanitizedTitle,
          subtitle: sanitizedSubtitle,
          isActive: isActive || false,
          displayRules: validatedDisplayRules,
          updatedAt: new Date(),
          updatedBy: user.userId,
          updatedByEmail: user.email
        }

        const existingPopup = await db.collection('settings').findOne({ type: 'offerPopup' }, { session })

        if (existingPopup) {
          if (existingPopup.imageSrc) {
            popupData.imageSrc = existingPopup.imageSrc
            popupData.imagePublicId = existingPopup.imagePublicId
          }
          
          await db.collection('settings').updateOne(
            { type: 'offerPopup' },
            { $set: popupData },
            { session }
          )
          console.log(`[${requestId}] Popup updated ✓`)
        } else {
          popupData.createdAt = new Date()
          popupData.createdBy = user.userId
          popupData.createdByEmail = user.email
          popupData.imageSrc = null
          popupData.imagePublicId = null
          
          await db.collection('settings').insertOne(popupData, { session })
          console.log(`[${requestId}] Popup created ✓`)
        }
      })
    } finally {
      await session.endSession()
    }

    const savedPopup = await db.collection('settings').findOne({ type: 'offerPopup' })
    const { createdBy, createdByEmail, updatedBy, updatedByEmail, __v, ...publicData } = savedPopup

    return NextResponse.json(
      {
        success: true,
        message: 'Popup saved successfully',
        data: publicData,
        requestId
      },
      { status: 200, headers: getSecurityHeaders() }
    )
  } catch (error) {
    return handleApiError(error, 'POST /api/offer-popup', requestId)
  }
}

// 🔥 PUT - Admin only: Upload image
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
        { success: false, message: 'Access denied', requestId },
        { status: 403, headers: getSecurityHeaders() }
      )
    }

    if (!cloudinaryConfigured) {
      return NextResponse.json(
        { success: false, message: 'Image upload is not configured', requestId },
        { status: 503, headers: getSecurityHeaders() }
      )
    }

    const formData = await req.formData()
    const file = formData.get('image')

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file provided', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    // Validate file type and extension
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    try {
      validateFileExtension(file.name, file.type)
    } catch (validationError) {
      return NextResponse.json(
        { success: false, message: validationError.message, requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    if (file.size > MAX_IMAGE_SIZE || file.size === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid file size', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const existingPopup = await db.collection('settings').findOne({ type: 'offerPopup' })

    if (!existingPopup) {
      return NextResponse.json(
        { success: false, message: 'Popup not found. Create popup data first.', requestId },
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
            folder: 'vwv/offer-popups',
            public_id: `offer_popup_${Date.now()}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
              { width: 600, height: 300, crop: 'fill', gravity: 'center' },
              { quality: 'auto:good' },
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
        { success: false, message: 'Image upload failed', requestId },
        { status: 500, headers: getSecurityHeaders() }
      )
    }

    // Transaction for atomicity
    const session = client.startSession()
    
    try {
      await session.withTransaction(async () => {
        await db.collection('settings').updateOne(
          { type: 'offerPopup' },
          {
            $set: {
              imageSrc: uploadResponse.secure_url,
              imagePublicId: uploadResponse.public_id,
              updatedAt: new Date(),
              updatedBy: user.userId
            }
          },
          { session }
        )
      })
      
      // Delete old image after successful DB update
      if (existingPopup.imagePublicId) {
        try {
          await cloudinary.uploader.destroy(existingPopup.imagePublicId)
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

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id
      },
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'PUT /api/offer-popup', requestId)
  }
}

// 🔥 PATCH - Toggle status
export async function PATCH(req) {
  const requestId = generateRequestId()
  const ip = getUserIP(req)
  logRequest(req, 'PATCH', requestId)

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

    const { isActive } = await req.json()

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isActive must be a boolean', requestId },
        { status: 400, headers: getSecurityHeaders() }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    if (isActive) {
      await db.collection('settings').updateMany(
        { type: 'offerPopup' },
        { $set: { isActive: false } }
      )
    }

    const result = await db.collection('settings').updateOne(
      { type: 'offerPopup' },
      { $set: { isActive, updatedAt: new Date(), updatedBy: user.userId } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Popup not found', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Popup ${isActive ? 'activated' : 'deactivated'}`,
      isActive,
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'PATCH /api/offer-popup', requestId)
  }
}

// 🔥 DELETE - Delete popup
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

    const client = await clientPromise
    const db = client.db('VWV')

    const popup = await db.collection('settings').findOne({ type: 'offerPopup' })

    if (!popup) {
      return NextResponse.json(
        { success: false, error: 'Popup not found', requestId },
        { status: 404, headers: getSecurityHeaders() }
      )
    }

    // Delete from DB first
    await db.collection('settings').deleteOne({ type: 'offerPopup' })

    // Then delete image
    if (popup.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(popup.imagePublicId)
      } catch (err) {
        console.error(`[${requestId}] Error deleting image:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Popup deleted successfully',
      requestId
    }, { status: 200, headers: getSecurityHeaders() })
    
  } catch (error) {
    return handleApiError(error, 'DELETE /api/offer-popup', requestId)
  }
}

// 🔒 OPTIONS - CORS preflight
export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
