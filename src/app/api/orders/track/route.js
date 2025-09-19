import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { verifyApiToken, createAuthError, checkRateLimit } from '@/lib/auth'

// 🔐 SECURITY CONSTANTS
const MAX_ORDER_ID_LENGTH = 50
const MAX_EMAIL_LENGTH = 100

// Rate limiting for tracking (more lenient for guests)
const RATE_LIMITS = {
  GUEST: { requests: 10, windowMs: 60000 }, // 10 requests per minute for guests
  USER: { requests: 20, windowMs: 60000 },
  ADMIN: { requests: 100, windowMs: 60000 },
}

// Enhanced error handling wrapper
function handleApiError(error, context = '') {
  console.error(`🚨 Track Order API Error in ${context}:`, error)
  console.error('Error stack:', error.stack)
  
  const isDevelopment = process.env.NODE_ENV === 'development'

  return NextResponse.json(
    {
      error: isDevelopment ? error.message : 'Internal server error',
      context: isDevelopment ? context : undefined,
      timestamp: new Date().toISOString(),
    },
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}

// 🔐 SECURITY: Enhanced input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;()&+${}]/g, '') // Remove dangerous chars
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove VBScript
    .replace(/onload/gi, '') // Remove event handlers
    .replace(/onclick/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000) // Limit length
}

// 🔐 SECURITY: Get user IP with proxy detection
function getUserIP(req) {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  return cfConnectingIP || 
         (forwarded && forwarded.split(',')[0]) || 
         realIP || 
         'unknown'
}

// 🔧 Optional user authentication (for better experience)
async function getUserInfo(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { role: 'guest', isAuthenticated: false }
    }
    
    // Check for temp token (development mode only)
    const token = authHeader.slice(7)
    if (process.env.NODE_ENV === 'development' && token === 'temp-admin-token-for-development') {
      console.log('🔧 Using temporary admin token for development')
      return { 
        role: 'admin', 
        userId: 'temp-admin', 
        email: 'temp@admin.dev',
        name: 'Temp Admin',
        isAuthenticated: true 
      }
    }
    
    const user = await verifyApiToken(req)
    return { 
      role: user.role || 'user', 
      userId: user.userId || user.id,
      email: user.email,
      name: user.name,
      isAuthenticated: true 
    }
  } catch (authError) {
    return { role: 'guest', isAuthenticated: false }
  }
}

// 🔧 Enhanced request logging
function logRequest(req, userInfo = null) {
  const timestamp = new Date().toISOString()
  const ip = getUserIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  console.log(`[${timestamp}] GET /api/orders/track`)
  console.log(`  IP: ${ip}`)
  console.log(`  User: ${userInfo?.email || 'guest'} (${userInfo?.role || 'guest'})`)
  console.log(`  UserAgent: ${userAgent.substring(0, 100)}`)
}

// GET: Track order by ID and email (works for guests and authenticated users)
export async function GET(req) {
  const ip = getUserIP(req)
  
  try {
    console.log('TRACK: Starting order tracking request...')
    
    // Optional authentication - guests are welcome
    const userInfo = await getUserInfo(req)
    logRequest(req, userInfo)
    
    const { searchParams } = new URL(req.url)
    const orderId = sanitizeInput(searchParams.get('orderId'))?.substring(0, MAX_ORDER_ID_LENGTH)
    const email = sanitizeInput(searchParams.get('email'))?.toLowerCase().substring(0, MAX_EMAIL_LENGTH)
    
    console.log('TRACK: Parameters:', { orderId, email, userType: userInfo.role })

    // Validate required parameters
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Apply rate limiting
    const rateLimit = RATE_LIMITS[userInfo.role?.toUpperCase()] || RATE_LIMITS.GUEST
    if (typeof checkRateLimit === 'function') {
      try {
        checkRateLimit(req, rateLimit)
      } catch (rateLimitError) {
        console.warn('⚠️ Rate limit exceeded for order tracking:', rateLimitError.message)
        return NextResponse.json(
          { error: 'Too many tracking requests. Please try again later.' },
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Find order by ID and email (security check)
    const order = await db.collection('orders').findOne({
      orderId: orderId,
      'customerInfo.email': email
    })

    if (!order) {
      console.log('TRACK: Order not found or email mismatch')
      
      // Create tracking attempt log (non-blocking)
      setImmediate(async () => {
        try {
          await db.collection('audit_logs').insertOne({
            action: 'ORDER_TRACK_ATTEMPT_FAILED',
            orderId,
            email,
            userType: userInfo.role,
            userId: userInfo.userId || null,
            reason: 'Order not found or email mismatch',
            timestamp: new Date(),
            ipAddress: ip
          })
        } catch (auditError) {
          console.error('❌ Audit log error:', auditError)
        }
      })

      return NextResponse.json(
        { error: 'Order not found. Please check your Order ID and email address.' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Order found for tracking:', order.orderId)
    console.log('🖼️ Order items with images:', order.items.map(item => ({
      name: item.product.name,
      hasImages: !!(item.product.images && item.product.images.length > 0),
      imageCount: item.product.images?.length || 0
    })))

    // ✅ FIXED: Filter sensitive information for response with IMAGES included
    const trackingResponse = {
      orderId: order.orderId,
      status: order.status,
      orderType: order.orderType || 'registered',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      // Customer info (limited)
      customerInfo: {
        fullName: order.customerInfo.fullName,
        email: order.customerInfo.email,
        phone: order.customerInfo.phone,
        city: order.customerInfo.city,
        country: order.customerInfo.country
      },
      
      // ✅ FIXED: Items info WITH COMPLETE PRODUCT DATA INCLUDING IMAGES
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal: item.itemTotal,
        selectedOptions: item.selectedOptions,
        // ✅ FIX: Include complete product object with images
        product: {
          _id: item.product._id,
          name: item.product.name,
          brand: item.product.brand,
          category: item.product.category,
          subcategory: item.product.subcategory,
          images: item.product.images || [] // ✅ This is what the frontend expects!
        }
      })),
      
      // Order totals
      totals: order.totals,
      
      // Payment info (limited)
      paymentInfo: {
        method: order.paymentInfo.method,
        // Only show last 4 digits for cards
        ...(order.paymentInfo.cardLast4 && { cardLast4: order.paymentInfo.cardLast4 })
      },
      
      // Shipping info
      shippingAddress: order.shippingAddress,
      
      // Tracking info
      trackingInfo: order.trackingInfo,
      deliveryDate: order.deliveryDate,
      
      // Order history
      orderHistory: order.orderHistory.map(history => ({
        status: history.status,
        timestamp: history.timestamp,
        note: history.note
      })),
      
      // Branch info
      branch: order.branch,
      orderNotes: order.orderNotes
    }

    // Log successful tracking with image info
    console.log('📦 Tracking response prepared with', trackingResponse.items.length, 'items')
    console.log('🖼️ Images in response:', trackingResponse.items.map(item => ({
      productName: item.productName,
      hasImages: item.product.images.length > 0,
      imageUrl: item.product.images[0]?.url || 'none'
    })))

    // Create successful tracking log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDER_TRACKED_SUCCESSFULLY',
          orderId: order.orderId,
          customerEmail: email,
          userType: userInfo.role,
          userId: userInfo.userId || null,
          orderStatus: order.status,
          itemCount: order.items.length,
          timestamp: new Date(),
          ipAddress: ip
        })
      } catch (auditError) {
        console.error('❌ Audit log error:', auditError)
      }
    })

    return NextResponse.json(
      {
        success: true,
        order: trackingResponse
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=300', // 5 minutes cache
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        },
      }
    )

  } catch (error) {
    return handleApiError(error, 'GET /api/orders/track')
  }
}
