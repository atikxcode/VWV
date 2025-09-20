import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { verifyApiToken, createAuthError, checkRateLimit } from '@/lib/auth'

// 🔐 SECURITY CONSTANTS
const MAX_ORDER_ID_LENGTH = 50
const MAX_EMAIL_LENGTH = 100

// 🆕 NEW: Define valid branches for validation
const VALID_BRANCHES = ['main', 'mirpur', 'bashundhara', 'dhanmondi', 'uttara', 'wari'] // Add your actual branches

// Rate limiting for tracking (more lenient for guests)
const RATE_LIMITS = {
  GUEST: { requests: 10, windowMs: 60000 }, // 10 requests per minute for guests
  USER: { requests: 20, windowMs: 60000 },
  ADMIN: { requests: 100, windowMs: 60000 },
  MODERATOR: { requests: 50, windowMs: 60000 },
  MANAGER: { requests: 80, windowMs: 60000 },
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
        branch: null,
        isAuthenticated: true 
      }
    }
    
    const user = await verifyApiToken(req)
    return { 
      role: user.role || 'user', 
      userId: user.userId || user.id,
      email: user.email,
      name: user.name,
      branch: user.branch || null, // 🆕 NEW: Include user branch
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
  console.log(`  Branch: ${userInfo?.branch || 'none'}`)
  console.log(`  UserAgent: ${userAgent.substring(0, 100)}`)
}

// 🆕 NEW: Enhanced branch information formatting for tracking response
function formatBranchInformation(order) {
  const branchInfo = {
    primaryBranch: order.branch || 'main',
    branchData: order.branchData || null
  }

  // Enhanced branch analysis if available
  if (order.branchData?.analysis) {
    branchInfo.fulfillmentDetails = {
      coveragePercentage: order.branchData.analysis.coveragePercentage || 0,
      fulfillmentType: order.branchData.analysis.fulfillmentType || 'single-branch',
      selectionMethod: order.branchData.selectionMethod || 'automatic'
    }
  }

  // Item-branch mapping
  branchInfo.itemAvailability = order.items.map(item => ({
    productId: item.productId,
    productName: item.product.name,
    availableBranches: item.availableBranches || [],
    selectedOptions: item.selectedOptions || {}
  }))

  return branchInfo
}

// 🆕 NEW: Calculate delivery status based on order info
function calculateDeliveryStatus(order) {
  const status = order.status
  const createdAt = new Date(order.createdAt)
  const now = new Date()
  const daysSinceCreated = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))

  let estimatedDelivery = null
  let statusMessage = ''

  switch (status) {
    case 'pending':
      estimatedDelivery = new Date(createdAt.getTime() + (3 * 24 * 60 * 60 * 1000)) // 3 days
      statusMessage = 'Your order is being processed and will be confirmed soon.'
      break
    case 'confirmed':
      estimatedDelivery = new Date(createdAt.getTime() + (2 * 24 * 60 * 60 * 1000)) // 2 days from now
      statusMessage = 'Your order has been confirmed and is being prepared for shipment.'
      break
    case 'processing':
      estimatedDelivery = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day from now
      statusMessage = 'Your order is currently being processed and will be shipped soon.'
      break
    case 'shipped':
      estimatedDelivery = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)) // 1 day from now
      statusMessage = 'Your order has been shipped and is on the way to you.'
      break
    case 'delivered':
      estimatedDelivery = order.deliveryDate ? new Date(order.deliveryDate) : null
      statusMessage = 'Your order has been successfully delivered.'
      break
    case 'cancelled':
      statusMessage = 'Your order has been cancelled.'
      break
    case 'refunded':
      statusMessage = 'Your order has been refunded.'
      break
    default:
      statusMessage = 'Order status update pending.'
  }

  return {
    currentStatus: status,
    statusMessage,
    estimatedDelivery,
    daysSinceOrdered: daysSinceCreated,
    isDelivered: status === 'delivered',
    isCancelled: ['cancelled', 'refunded'].includes(status),
    canTrack: ['confirmed', 'processing', 'shipped'].includes(status)
  }
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
    console.log('🏢 Order branch:', order.branch)
    console.log('🖼️ Order items with images:', order.items.map(item => ({
      name: item.product.name,
      hasImages: !!(item.product.images && item.product.images.length > 0),
      imageCount: item.product.images?.length || 0,
      availableBranches: item.availableBranches?.length || 0
    })))

    // 🆕 ENHANCED: Generate branch information and delivery status
    const branchInformation = formatBranchInformation(order)
    const deliveryStatus = calculateDeliveryStatus(order)

    // ✅ ENHANCED: Filter sensitive information for response with complete branch data
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
      
      // ✅ ENHANCED: Items info with complete product data including images and branch info
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        brand: item.product.brand,
        quantity: item.quantity,
        price: item.product.price,
        itemTotal: item.itemTotal,
        selectedOptions: item.selectedOptions || {}, // 🆕 Enhanced specifications
        availableBranches: item.availableBranches || [], // 🆕 Branch availability for each item
        // Complete product object with images
        product: {
          _id: item.product._id,
          name: item.product.name,
          brand: item.product.brand,
          category: item.product.category,
          subcategory: item.product.subcategory,
          images: item.product.images || []
        }
      })),
      
      // Order totals with delivery charge breakdown
      totals: {
        ...order.totals,
        // Ensure delivery charge is included
        deliveryCharge: order.totals.deliveryCharge || 0
      },
      
      // Payment info (limited)
      paymentInfo: {
        method: order.paymentInfo.method,
        // Only show last 4 digits for cards
        ...(order.paymentInfo.cardLast4 && { cardLast4: order.paymentInfo.cardLast4 })
      },
      
      // Shipping info
      shippingAddress: order.shippingAddress,
      
      // 🆕 ENHANCED: Tracking and delivery information
      trackingInfo: order.trackingInfo,
      deliveryDate: order.deliveryDate,
      deliveryStatus, // 🆕 NEW: Enhanced delivery status information
      
      // 🆕 ENHANCED: Order history with better formatting
      orderHistory: order.orderHistory.map(history => ({
        status: history.status,
        timestamp: history.timestamp,
        note: history.note,
        // Include role info for internal users (admins can see who updated)
        ...(userInfo.role === 'admin' && history.updatedByRole && {
          updatedBy: history.updatedByRole
        })
      })),
      
      // 🆕 ENHANCED: Comprehensive branch information
      branchInformation, // 🆕 NEW: Complete branch data
      
      // Order notes
      orderNotes: order.orderNotes,
      
      // 🆕 NEW: Additional tracking metadata
      trackingMetadata: {
        canCancel: order.status === 'pending' && 
                  ((Date.now() - new Date(order.createdAt).getTime()) < 5 * 60 * 1000), // 5 minutes
        estimatedProcessingTime: deliveryStatus.estimatedDelivery,
        orderAge: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)), // days
        lastUpdated: order.updatedAt
      }
    }

    // 🆕 ENHANCED: Log successful tracking with detailed branch info
    console.log('📦 Tracking response prepared with', trackingResponse.items.length, 'items')
    console.log('🏢 Branch fulfillment details:', {
      primaryBranch: branchInformation.primaryBranch,
      fulfillmentType: branchInformation.fulfillmentDetails?.fulfillmentType,
      coveragePercentage: branchInformation.fulfillmentDetails?.coveragePercentage
    })
    console.log('🖼️ Images in response:', trackingResponse.items.map(item => ({
      productName: item.productName,
      hasImages: item.product.images.length > 0,
      imageUrl: item.product.images[0]?.url || 'none',
      branches: item.availableBranches.join(', ') || 'none'
    })))

    // 🆕 ENHANCED: Create successful tracking log with branch information
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDER_TRACKED_SUCCESSFULLY',
          orderId: order.orderId,
          customerEmail: email,
          userType: userInfo.role,
          userId: userInfo.userId || null,
          userBranch: userInfo.branch || null, // 🆕 NEW: Log user's branch
          orderStatus: order.status,
          orderBranch: order.branch, // 🆕 NEW: Log order's branch
          itemCount: order.items.length,
          deliveryCharge: order.totals.deliveryCharge || 0,
          fulfillmentType: branchInformation.fulfillmentDetails?.fulfillmentType || 'single-branch',
          // 🆕 NEW: Log branch coverage for analysis
          branchCoverage: branchInformation.fulfillmentDetails?.coveragePercentage || 100,
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
        order: trackingResponse,
        // 🆕 NEW: Additional tracking context
        trackingContext: {
          requestedBy: userInfo.role,
          requestedAt: new Date().toISOString(),
          supportedFeatures: {
            branchTracking: true,
            deliveryEstimation: true,
            realTimeUpdates: false,
            cancelationSupport: trackingResponse.trackingMetadata.canCancel
          }
        }
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

// 🆕 NEW: POST method for advanced tracking queries (authenticated users only)
export async function POST(req) {
  const ip = getUserIP(req)
  
  try {
    console.log('TRACK POST: Starting advanced tracking request...')
    
    // Require authentication for POST requests
    let userInfo
    try {
      userInfo = await getUserInfo(req)
      if (!userInfo.isAuthenticated) {
        return createAuthError('Authentication required for advanced tracking features', 401)
      }
    } catch (authError) {
      return createAuthError('Authentication failed', 401)
    }
    
    logRequest(req, userInfo)
    
    const body = await req.json()
    const { orderIds, branchFilter, statusFilter, dateRange } = body
    
    // Validate input
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json(
        { error: 'Order IDs array is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    if (orderIds.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 orders can be tracked at once' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    const client = await clientPromise
    const db = client.db('VWV')
    
    // Build query based on user role
    let query = {
      orderId: { $in: orderIds.map(id => sanitizeInput(id)) }
    }
    
    // Apply role-based filtering
    if (userInfo.role === 'user') {
      query['customerInfo.email'] = userInfo.email
    } else if (userInfo.role === 'moderator') {
      if (userInfo.branch) {
        query.branch = userInfo.branch
      }
    }
    // Admins and managers can see all orders
    
    // Apply additional filters
    if (branchFilter && VALID_BRANCHES.includes(branchFilter.toLowerCase())) {
      query.branch = branchFilter.toLowerCase()
    }
    
    if (statusFilter) {
      query.status = statusFilter
    }
    
    if (dateRange && dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    }
    
    const orders = await db.collection('orders').find(query).toArray()
    
    const trackingResults = orders.map(order => ({
      orderId: order.orderId,
      status: order.status,
      branch: order.branch,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerInfo: {
        fullName: order.customerInfo.fullName,
        email: order.customerInfo.email,
        city: order.customerInfo.city
      },
      totals: order.totals,
      branchInformation: formatBranchInformation(order),
      deliveryStatus: calculateDeliveryStatus(order)
    }))
    
    return NextResponse.json(
      {
        success: true,
        orders: trackingResults,
        summary: {
          totalOrders: trackingResults.length,
          byStatus: trackingResults.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1
            return acc
          }, {}),
          byBranch: trackingResults.reduce((acc, order) => {
            acc[order.branch] = (acc[order.branch] || 0) + 1
            return acc
          }, {})
        }
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )
    
  } catch (error) {
    return handleApiError(error, 'POST /api/orders/track')
  }
}
