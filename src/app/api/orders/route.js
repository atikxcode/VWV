import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { verifyApiToken, requireRole, createAuthError, checkRateLimit } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// 🔐 SECURITY CONSTANTS
const MAX_ORDER_ITEMS = 50
const MAX_REQUEST_BODY_SIZE = 100000 // 100KB for orders
const MIN_ORDER_VALUE = 1
const MAX_ORDER_VALUE = 5000000 // 5M BDT
const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const MAX_SEARCH_LENGTH = 100
const MAX_NOTES_LENGTH = 1000
const MAX_ORDER_ID_LENGTH = 50

// Rate limiting per role
const RATE_LIMITS = {
  USER: { requests: 50, windowMs: 60000 },
  ADMIN: { requests: 500, windowMs: 60000 },
  MODERATOR: { requests: 300, windowMs: 60000 },
  MANAGER: { requests: 400, windowMs: 60000 },
}

// Enhanced error handling wrapper
function handleApiError(error, context = '') {
  console.error(`🚨 Orders API Error in ${context}:`, error)
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

// 🔐 SECURITY: Enhanced request logging
function logRequest(req, method, userInfo = null) {
  const timestamp = new Date().toISOString()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const referer = req.headers.get('referer') || 'direct'
  
  console.log(`[${timestamp}] ${method} /api/orders`)
  console.log(`  IP: ${ip}`)
  console.log(`  User: ${userInfo?.email || 'anonymous'} (${userInfo?.role || 'none'})`)
  console.log(`  UserAgent: ${userAgent.substring(0, 100)}`)
  console.log(`  Referer: ${referer}`)
  console.log(`  URL: ${req.url}`)
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

// 🔧 CRITICAL: Enhanced user authentication with detailed validation
async function getUserInfo(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header provided')
    }
    
    const token = authHeader.slice(7)
    
    // Check for temp token (development mode only)
    if (process.env.NODE_ENV === 'development' && token === 'temp-admin-token-for-development') {
      console.log('🔧 Using temporary admin token for development')
      return { 
        role: 'admin', 
        branch: null, 
        userId: 'temp-admin', 
        email: 'temp@admin.dev',
        name: 'Temp Admin',
        isAuthenticated: true 
      }
    }
    
    // Verify token and get user info
    const user = await verifyApiToken(req)
    
    if (!user) {
      throw new Error('Token verification failed')
    }
    
    return { 
      role: user.role || 'user', 
      branch: user.branch || null, 
      userId: user.userId || user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      isAuthenticated: true 
    }
  } catch (authError) {
    console.error('🔐 Authentication failed:', authError.message)
    throw authError // Re-throw for proper error handling
  }
}

// 🔧 Generate unique order ID with better entropy
function generateOrderId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  const extra = Math.floor(Math.random() * 1000).toString(36)
  return `VWV${timestamp}${random}${extra}`.toUpperCase()
}

// 🔧 Comprehensive order items validation
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item')
  }
  
  if (items.length > MAX_ORDER_ITEMS) {
    throw new Error(`Order cannot contain more than ${MAX_ORDER_ITEMS} items`)
  }
  
  for (const [index, item] of items.entries()) {
    if (!item.product || !item.product._id) {
      throw new Error(`Item ${index + 1}: Must have a valid product`)
    }
    
    if (!item.quantity || item.quantity < 1 || item.quantity > 999) {
      throw new Error(`Item ${index + 1}: Must have a valid quantity (1-999)`)
    }
    
    if (!item.product.price || item.product.price < 0) {
      throw new Error(`Item ${index + 1}: Must have a valid price`)
    }
    
    if (!item.product.name) {
      throw new Error(`Item ${index + 1}: Product must have a name`)
    }

    // Simple branch validation
    if (item.availableBranches) {
      if (!Array.isArray(item.availableBranches)) {
        throw new Error(`Item ${index + 1}: availableBranches must be an array`)
      }
      
      item.availableBranches.forEach((branch, branchIndex) => {
        if (typeof branch !== 'string') {
          throw new Error(`Item ${index + 1}, branch ${branchIndex + 1}: Branch name must be a string`)
        }
      })
    }

    // Simple selected options validation
    if (item.selectedOptions) {
      if (typeof item.selectedOptions !== 'object' || Array.isArray(item.selectedOptions)) {
        throw new Error(`Item ${index + 1}: selectedOptions must be an object`)
      }
    }
  }
  
  return true
}

// 🆕 UPDATED: Calculate order totals with delivery charges
function calculateOrderTotals(items, deliveryCharge = 0) {
  let subtotal = 0
  let totalQuantity = 0
  
  items.forEach(item => {
    const itemPrice = parseFloat(item.product.price) || 0
    const itemQuantity = parseInt(item.quantity) || 0
    const itemTotal = itemPrice * itemQuantity
    
    if (itemTotal < 0) {
      throw new Error(`Invalid item total for ${item.product.name}: ${itemTotal}`)
    }
    
    subtotal += itemTotal
    totalQuantity += itemQuantity
  })
  
  // Validate delivery charge
  const validatedDeliveryCharge = parseFloat(deliveryCharge) || 0
  if (validatedDeliveryCharge < 0 || validatedDeliveryCharge > 1000) {
    throw new Error('Delivery charge must be between 0 and 1000 BDT')
  }
  
  // Future: Add tax, discount calculations
  const tax = 0
  const discount = 0
  
  // Calculate total
  const total = subtotal + tax + validatedDeliveryCharge - discount
  
  if (total < MIN_ORDER_VALUE || total > MAX_ORDER_VALUE) {
    throw new Error(`Order total must be between ${MIN_ORDER_VALUE} and ${MAX_ORDER_VALUE} BDT`)
  }
  
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    deliveryCharge: Math.round(validatedDeliveryCharge * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
    itemCount: items.length,
    totalQuantity
  }
}

// GET: Retrieve orders with strict role-based access control
export async function GET(req) {
  const ip = getUserIP(req)

  try {
    console.log('GET: Starting orders request processing...')
    
    // 🔐 MANDATORY AUTHENTICATION
    const userInfo = await getUserInfo(req)
    logRequest(req, 'GET', userInfo)

    // Apply role-based rate limiting
    const rateLimit = RATE_LIMITS[userInfo.role?.toUpperCase()] || RATE_LIMITS.USER
    if (typeof checkRateLimit === 'function') {
      try {
        checkRateLimit(req, rateLimit)
      } catch (rateLimitError) {
        console.warn('⚠️ Rate limit exceeded:', rateLimitError.message)
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const { searchParams } = new URL(req.url)
    
    // Extract and sanitize query parameters
    const orderId = sanitizeInput(searchParams.get('orderId'))?.substring(0, MAX_ORDER_ID_LENGTH)
    const status = sanitizeInput(searchParams.get('status'))
    const customerEmail = sanitizeInput(searchParams.get('customerEmail'))
    const branch = sanitizeInput(searchParams.get('branch'))
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 100)
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1)
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1

    console.log('GET: Search params:', { orderId, status, customerEmail, branch, limit, page, sortBy })

    const client = await clientPromise
    const db = client.db('VWV')

    // 🔐 BUILD QUERY WITH ROLE-BASED ACCESS CONTROL
    let query = {}

    // Apply filters based on provided parameters
    if (orderId) {
      query.orderId = orderId
    }

    if (status && ORDER_STATUSES.includes(status)) {
      query.status = status
    }

    if (branch) {
      query.availableBranches = branch
    }

    // 🔐 CRITICAL: Role-based data access control
    if (userInfo.role === 'user') {
      query['customerInfo.email'] = userInfo.email
      console.log('👤 User access: Filtering orders for', userInfo.email)
      
      if (customerEmail && customerEmail !== userInfo.email) {
        return createAuthError('Access denied: Cannot view other customers\' orders', 403)
      }
      
    } else if (userInfo.role === 'moderator') {
      if (userInfo.branch) {
        query.availableBranches = userInfo.branch
        console.log('👮 Moderator access: Filtering orders for branch', userInfo.branch)
      }
      
      if (customerEmail) {
        query['customerInfo.email'] = customerEmail
      }
      
    } else if (['admin', 'manager'].includes(userInfo.role)) {
      console.log('👑 Admin/Manager access: Full access to all orders')
      
      if (customerEmail) {
        query['customerInfo.email'] = customerEmail
      }
      
    } else {
      return createAuthError('Insufficient permissions to view orders', 403)
    }

    console.log('🔍 Final query:', JSON.stringify(query, null, 2))

    // Get total count for pagination
    const totalOrders = await db.collection('orders').countDocuments(query)
    console.log('📊 Total orders found:', totalOrders)

    // Build sort object with validation
    const allowedSortFields = ['createdAt', 'updatedAt', 'orderId', 'status', 'totals.total']
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt'
    
    const sortObject = { [finalSortBy]: sortOrder }
    if (finalSortBy !== 'createdAt') {
      sortObject.createdAt = -1 // Secondary sort by creation date
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch orders with optimized projection
    const orders = await db
      .collection('orders')
      .find(query)
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .toArray()

    console.log('✅ Orders fetched successfully, count:', orders.length)

    // 🔐 FILTER SENSITIVE DATA based on user role
    const filteredOrders = orders.map(order => {
      if (userInfo.role === 'user') {
        if (order.paymentInfo) {
          const { cardNumber, cvv, bkashNumber, nagadNumber, rocketNumber, upayNumber, ...safePaymentInfo } = order.paymentInfo
          order.paymentInfo = {
            method: safePaymentInfo.method,
            ...(safePaymentInfo.cardLast4 && { cardLast4: safePaymentInfo.cardLast4 }),
            ...(safePaymentInfo.cardName && { cardName: safePaymentInfo.cardName })
          }
        }
      } else if (userInfo.role === 'moderator') {
        if (order.paymentInfo) {
          const { cardNumber, cvv, ...safePaymentInfo } = order.paymentInfo
          order.paymentInfo = safePaymentInfo
        }
      }
      
      return order
    })

    // Create access log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDERS_ACCESSED',
          userId: userInfo.userId,
          userEmail: userInfo.email,
          userRole: userInfo.role,
          queryParams: { orderId, status, customerEmail, branch, limit, page },
          resultCount: orders.length,
          totalAvailable: totalOrders,
          timestamp: new Date(),
          ipAddress: ip
        })
      } catch (auditError) {
        console.error('❌ Audit log error:', auditError)
      }
    })

    return NextResponse.json(
      {
        orders: filteredOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: skip + orders.length < totalOrders,
          hasPrevPage: page > 1,
          itemsPerPage: limit
        },
        userPermissions: {
          canViewAll: ['admin', 'manager'].includes(userInfo.role),
          canModifyStatus: ['admin', 'manager', 'moderator'].includes(userInfo.role),
          branch: userInfo.branch
        }
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        },
      }
    )

  } catch (error) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return createAuthError(error.message, 401)
    }
    return handleApiError(error, 'GET /api/orders')
  }
}

// POST: Create new order
export async function POST(req) {
  const ip = getUserIP(req)

  try {
    console.log('POST: Processing order creation...')
    
    // 🔓 OPTIONAL AUTHENTICATION - Guest checkout allowed
    let userInfo = null
    let isGuestOrder = false
    
    try {
      userInfo = await getUserInfo(req)
      console.log('🔑 Authenticated user:', userInfo.email)
    } catch (authError) {
      console.log('👤 Guest checkout detected')
      isGuestOrder = true
      userInfo = {
        role: 'guest',
        branch: null,
        userId: null,
        email: null,
        name: null,
        isAuthenticated: false
      }
    }

    logRequest(req, 'POST', userInfo)

    const body = await req.json()

    // Validate request body size
    const bodySize = JSON.stringify(body).length
    if (bodySize > MAX_REQUEST_BODY_SIZE) {
      console.log('❌ Request body too large:', bodySize)
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const {
      items,
      customerInfo,
      paymentInfo,
      shippingAddress,
      orderNotes,
      deliveryCharge = 0
    } = body

    // Validate required fields
    if (!items || !customerInfo || !paymentInfo) {
      return NextResponse.json(
        { error: 'Items, customer info, and payment info are required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate order items
    try {
      validateOrderItems(items)
    } catch (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate delivery charge
    const validatedDeliveryCharge = parseFloat(deliveryCharge) || 0
    if (validatedDeliveryCharge < 0 || validatedDeliveryCharge > 1000) {
      return NextResponse.json(
        { error: 'Invalid delivery charge (must be between 0-1000 BDT)' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize customer info
    const sanitizedCustomerInfo = {
      fullName: sanitizeInput(customerInfo.fullName)?.substring(0, 100),
      email: sanitizeInput(customerInfo.email)?.toLowerCase(),
      phone: sanitizeInput(customerInfo.phone)?.substring(0, 20),
      address: sanitizeInput(customerInfo.address)?.substring(0, 500),
      city: sanitizeInput(customerInfo.city)?.substring(0, 50),
      postalCode: sanitizeInput(customerInfo.postalCode)?.substring(0, 20),
      country: sanitizeInput(customerInfo.country)?.substring(0, 50) || 'Bangladesh'
    }

    // Guest checkout validation
    if (!isGuestOrder && userInfo.email !== sanitizedCustomerInfo.email) {
      return createAuthError('Authenticated users can only create orders with their own email address', 403)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedCustomerInfo.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Calculate totals
    let totals
    try {
      totals = calculateOrderTotals(items, validatedDeliveryCharge)
    } catch (calculationError) {
      return NextResponse.json(
        { error: calculationError.message },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Generate unique order ID
    let orderId
    let attempts = 0
    const maxAttempts = 5
    
    do {
      orderId = generateOrderId()
      const existingOrder = await db.collection('orders').findOne({ orderId })
      if (!existingOrder) break
      attempts++
    } while (attempts < maxAttempts)
    
    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique order ID')
    }

    // Sanitize payment info
    const sanitizedPaymentInfo = {
      method: sanitizeInput(paymentInfo.method),
      ...(paymentInfo.method === 'bkash' && { bkashNumber: sanitizeInput(paymentInfo.bkashNumber)?.substring(0, 15) }),
      ...(paymentInfo.method === 'nagad' && { nagadNumber: sanitizeInput(paymentInfo.nagadNumber)?.substring(0, 15) }),
      ...(paymentInfo.method === 'rocket' && { rocketNumber: sanitizeInput(paymentInfo.rocketNumber)?.substring(0, 15) }),
      ...(paymentInfo.method === 'upay' && { upayNumber: sanitizeInput(paymentInfo.upayNumber)?.substring(0, 15) }),
      ...(paymentInfo.method === 'card' && { 
        cardLast4: paymentInfo.cardNumber ? paymentInfo.cardNumber.replace(/\D/g, '').slice(-4) : '',
        cardName: sanitizeInput(paymentInfo.cardName)?.substring(0, 50)
      })
    }

    // 🔥 SIMPLE: Get all available branches from items
    const allAvailableBranches = []
    items.forEach(item => {
      if (item.availableBranches && Array.isArray(item.availableBranches)) {
        item.availableBranches.forEach(branch => {
          const normalizedBranch = branch.toLowerCase()
          if (!allAvailableBranches.includes(normalizedBranch)) {
            allAvailableBranches.push(normalizedBranch)
          }
        })
      }
    })

    // 🔥 SIMPLE: Create order object with ONLY availableBranches array
    const newOrder = {
      orderId,
      status: 'pending',
      orderType: isGuestOrder ? 'guest' : 'registered',
      items: items.map(item => ({
        productId: item.product._id,
        product: {
          _id: item.product._id,
          name: sanitizeInput(item.product.name),
          price: parseFloat(item.product.price),
          images: item.product.images || [],
          brand: sanitizeInput(item.product.brand) || '',
          category: sanitizeInput(item.product.category) || '',
          subcategory: sanitizeInput(item.product.subcategory) || ''
        },
        quantity: parseInt(item.quantity),
        selectedOptions: item.selectedOptions || {},
        // 🔥 SIMPLE: Only availableBranches array
        availableBranches: item.availableBranches || [],
        itemTotal: parseFloat(item.product.price) * parseInt(item.quantity)
      })),
      customerInfo: sanitizedCustomerInfo,
      paymentInfo: sanitizedPaymentInfo,
      shippingAddress: shippingAddress || sanitizedCustomerInfo,
      orderNotes: sanitizeInput(orderNotes)?.substring(0, MAX_NOTES_LENGTH) || '',
      
      // 🔥 SIMPLE: Only availableBranches array at order level
      availableBranches: allAvailableBranches,
      
      totals,
      createdAt: new Date(),
      updatedAt: new Date(),
      
      createdBy: isGuestOrder ? 'guest' : userInfo.userId,
      createdByRole: isGuestOrder ? 'guest' : userInfo.role,
      createdByEmail: sanitizedCustomerInfo.email,
      
      orderHistory: [{
        status: 'pending',
        timestamp: new Date(),
        note: isGuestOrder ? 'Guest order placed successfully' : 'Order placed successfully',
        updatedBy: isGuestOrder ? 'guest' : userInfo.userId,
        updatedByRole: isGuestOrder ? 'guest' : userInfo.role
      }],
      
      trackingInfo: null,
      deliveryDate: null,
      cancelledAt: null,
      refundedAt: null,
      
      clientIP: ip,
      userAgent: req.headers.get('user-agent')?.substring(0, 200) || 'unknown'
    }

    // Insert order into database
    const result = await db.collection('orders').insertOne(newOrder)
    
    if (!result.insertedId) {
      throw new Error('Failed to create order in database')
    }

    console.log('✅ Order created successfully')
    console.log('📋 Order ID:', orderId)
    console.log('👤 Order type:', isGuestOrder ? 'Guest' : 'Registered')
    console.log('🏪 Available branches:', allAvailableBranches)
    console.log('💰 Total amount:', totals.total)

    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDER_CREATED',
          orderType: isGuestOrder ? 'guest' : 'registered',
          userId: isGuestOrder ? null : userInfo.userId,
          userEmail: isGuestOrder ? null : userInfo.email,
          userRole: isGuestOrder ? 'guest' : userInfo.role,
          orderId,
          customerEmail: sanitizedCustomerInfo.email,
          orderSubtotal: totals.subtotal,
          deliveryCharge: totals.deliveryCharge,
          orderTotal: totals.total,
          itemCount: totals.itemCount,
          paymentMethod: sanitizedPaymentInfo.method,
          availableBranches: allAvailableBranches,
          timestamp: new Date(),
          ipAddress: ip
        })
      } catch (auditError) {
        console.error('❌ Audit log error:', auditError)
      }
    })

    // Return created order (without sensitive payment info)
    const { paymentInfo: { cardNumber, cvv, ...safePaymentInfo }, ...safeOrder } = newOrder
    safeOrder.paymentInfo = safePaymentInfo

    return NextResponse.json(
      {
        success: true,
        message: isGuestOrder ? 'Guest order placed successfully' : 'Order placed successfully',
        order: { ...safeOrder, _id: result.insertedId },
        orderType: isGuestOrder ? 'guest' : 'registered'
      },
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    return handleApiError(error, 'POST /api/orders')
  }
}

// PUT: Update order status (Admin/Moderator/Manager only)
export async function PUT(req) {
  const ip = getUserIP(req)

  try {
    const userInfo = await getUserInfo(req)
    logRequest(req, 'PUT', userInfo)

    if (!['admin', 'manager', 'moderator'].includes(userInfo.role)) {
      return createAuthError('Insufficient permissions. Only admins, managers, and moderators can update orders', 403)
    }

    const body = await req.json()
    const { orderId, status, notes, trackingInfo } = body

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!ORDER_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}` },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const sanitizedOrderId = sanitizeInput(orderId)?.substring(0, MAX_ORDER_ID_LENGTH)
    const sanitizedNotes = sanitizeInput(notes)?.substring(0, MAX_NOTES_LENGTH)
    const sanitizedTrackingInfo = sanitizeInput(trackingInfo)?.substring(0, 100)

    const client = await clientPromise
    const db = client.db('VWV')

    const existingOrder = await db.collection('orders').findOne({ orderId: sanitizedOrderId })
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Branch-based access control for moderators
    if (userInfo.role === 'moderator' && userInfo.branch && !existingOrder.availableBranches.includes(userInfo.branch)) {
      return createAuthError('Access denied: Cannot update orders from other branches', 403)
    }

    const updateData = {
      status,
      updatedAt: new Date(),
      updatedBy: userInfo.userId,
      updatedByRole: userInfo.role
    }

    if (status === 'shipped' && sanitizedTrackingInfo) {
      updateData.trackingInfo = sanitizedTrackingInfo
    } else if (status === 'delivered') {
      updateData.deliveryDate = new Date()
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
    } else if (status === 'refunded') {
      updateData.refundedAt = new Date()
    }

    const historyEntry = {
      status,
      timestamp: new Date(),
      note: sanitizedNotes || `Status changed to ${status}`,
      updatedBy: userInfo.userId,
      updatedByRole: userInfo.role
    }

    const result = await db.collection('orders').updateOne(
      { orderId: sanitizedOrderId },
      {
        $set: updateData,
        $push: { orderHistory: historyEntry }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Order not found for update' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Order updated successfully')
    console.log('📋 Order ID:', sanitizedOrderId)
    console.log('📊 New status:', status)

    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDER_STATUS_UPDATED',
          userId: userInfo.userId,
          userEmail: userInfo.email,
          userRole: userInfo.role,
          orderId: sanitizedOrderId,
          customerEmail: existingOrder.customerInfo.email,
          oldStatus: existingOrder.status,
          newStatus: status,
          notes: sanitizedNotes || '',
          trackingInfo: sanitizedTrackingInfo || '',
          availableBranches: existingOrder.availableBranches,
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
        message: 'Order updated successfully',
        orderId: sanitizedOrderId,
        status,
        updatedAt: updateData.updatedAt
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return createAuthError(error.message, 401)
    }
    return handleApiError(error, 'PUT /api/orders')
  }
}

// DELETE: Cancel order
export async function DELETE(req) {
  const ip = getUserIP(req)

  try {
    const userInfo = await getUserInfo(req)
    logRequest(req, 'DELETE', userInfo)

    const { searchParams } = new URL(req.url)
    const orderId = sanitizeInput(searchParams.get('orderId'))?.substring(0, MAX_ORDER_ID_LENGTH)

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const existingOrder = await db.collection('orders').findOne({ orderId })
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const isAdmin = ['admin', 'manager'].includes(userInfo.role)
    const isModerator = userInfo.role === 'moderator'
    const isOrderOwner = existingOrder.customerInfo.email === userInfo.email
    const orderAge = Date.now() - new Date(existingOrder.createdAt).getTime()
    const canCancelTimeLimit = orderAge < 5 * 60 * 1000 // 5 minutes
    const isOrderPending = existingOrder.status === 'pending'

    if (isAdmin) {
      // Admins can cancel any order
    } else if (isModerator) {
      // Moderators can cancel orders from their branch
      if (userInfo.branch && !existingOrder.availableBranches.includes(userInfo.branch)) {
        return createAuthError('Access denied: Cannot cancel orders from other branches', 403)
      }
    } else if (userInfo.role === 'user') {
      // Users can only cancel their own pending orders within time limit
      if (!isOrderOwner) {
        return createAuthError('Access denied: Cannot cancel other users\' orders', 403)
      }
      if (!isOrderPending) {
        return createAuthError('Cannot cancel order: Order is not in pending status', 403)
      }
      if (!canCancelTimeLimit) {
        return createAuthError('Cannot cancel order: Time limit exceeded (5 minutes)', 403)
      }
    } else {
      return createAuthError('Insufficient permissions to cancel orders', 403)
    }

    // Update order to cancelled status
    const result = await db.collection('orders').updateOne(
      { orderId },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
          updatedBy: userInfo.userId,
          updatedByRole: userInfo.role
        },
        $push: {
          orderHistory: {
            status: 'cancelled',
            timestamp: new Date(),
            note: isAdmin ? 'Order cancelled by admin' : 
                  isModerator ? 'Order cancelled by moderator' : 
                  'Order cancelled by customer',
            updatedBy: userInfo.userId,
            updatedByRole: userInfo.role
          }
        }
      }
    )

    console.log('✅ Order cancelled successfully')
    console.log('📋 Order ID:', orderId)

    // Create audit log (non-blocking)
    setImmediate(async () => {
      try {
        await db.collection('audit_logs').insertOne({
          action: 'ORDER_CANCELLED',
          userId: userInfo.userId,
          userEmail: userInfo.email,
          userRole: userInfo.role,
          orderId,
          customerEmail: existingOrder.customerInfo.email,
          cancelledBy: isAdmin ? 'admin' : isModerator ? 'moderator' : 'customer',
          orderTotal: existingOrder.totals.total,
          availableBranches: existingOrder.availableBranches,
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
        message: 'Order cancelled successfully',
        orderId,
        cancelledAt: new Date()
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    if (error.message.includes('Authentication') || error.message.includes('Access denied')) {
      return createAuthError(error.message, 401)
    }
    return handleApiError(error, 'DELETE /api/orders')
  }
}
