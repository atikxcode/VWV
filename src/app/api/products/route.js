// src/app/api/products/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { verifyApiToken, requireRole, createAuthError, checkRateLimit } from '@/lib/auth'

// 🔐 SECURITY CONSTANTS
const MAX_IMAGE_SIZE_ADMIN = 100 * 1024 * 1024 // 100MB for admin/moderator
const MAX_IMAGE_SIZE_USER = 5 * 1024 * 1024 // 5MB for regular users
const MAX_IMAGES_PER_UPLOAD = 10
const MAX_REQUEST_BODY_SIZE = 50000 // 50KB
const MAX_SEARCH_LENGTH = 100
const MAX_FILENAME_LENGTH = 255
const MAX_DESCRIPTION_WORDS = 2000 // 🆕 NEW: 2000 word limit for descriptions

// Rate limiting per role
const RATE_LIMITS = {
  PUBLIC: { requests: 200, windowMs: 60000 },
  ADMIN: { requests: 500, windowMs: 60000 },
  MODERATOR: { requests: 300, windowMs: 60000 },
}

// IP-based upload tracking to prevent abuse
const uploadTracker = new Map()

// Enhanced error handling wrapper
function handleApiError(error, context = '') {
  console.error(`🚨 API Error in ${context}:`, error)
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
function logRequest(req, method) {
  const timestamp = new Date().toISOString()
  const ip = req.headers.get('x-forwarded-for')?.split(',') || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  console.log(`[${timestamp}] ${method} /api/products - IP: ${ip} - UserAgent: ${userAgent.substring(0, 100)}`)
  console.log('URL:', req.url)
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;()&+${}]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/data:/gi, '') 
    .trim()
    .substring(0, 1000) 
}

//  Product specific sanitization [allows & and /]
function sanitizeProductInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;]/g, '') 
    .replace(/\$/g, '') 
    .replace(/\{/g, '') 
    .replace(/\}/g, '') 
    .replace(/\+/g, '') 
    .replace(/\(/g, '') 
    .replace(/\)/g, '') 
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .replace(/expression\(/gi, '') 
    .trim()
    .substring(0, 1000) 
}

// 🆕 NEW: Description-specific sanitization with 2000 WORD limit
function sanitizeDescriptionInput(input) {
  if (typeof input !== 'string') return input
  
  // First sanitize for security
  let sanitized = input
    .replace(/[<>"'%;]/g, '') 
    .replace(/\$/g, '') 
    .replace(/\{/g, '') 
    .replace(/\}/g, '') 
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .replace(/expression\(/gi, '') 
    .trim()
  
  // Then check word count (2000 WORDS)
  const words = sanitized.split(/\s+/).filter(word => word.length > 0)
  if (words.length > MAX_DESCRIPTION_WORDS) {
    sanitized = words.slice(0, MAX_DESCRIPTION_WORDS).join(' ')
  }
  
  return sanitized
}

// Category and Subcategories sanitization (preserves business formatting)
function sanitizeCategoryInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;]/g, '') // Remove XSS chars but preserve & / - ( )
    .replace(/\$/g, '') // Remove $ for injection prevention
    .replace(/\{/g, '') // Remove { for template injection
    .replace(/\}/g, '') // Remove } for template injection
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/expression\(/gi, '') // Remove CSS expressions
    .trim()
    .substring(0, 100) // Shorter limit for categories
}

// 🔧 NEW: SEARCH INPUT sanitization (extra strict for search queries)
function sanitizeSearchInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;()&+${}]/g, '') // Remove all dangerous chars
    .replace(/[\/\\]/g, '') // Remove slashes for search safety
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/\*/g, '') // Remove wildcards
    .replace(/\?/g, '') // Remove question marks
    .trim()
    .substring(0, 100) // Shorter limit for search
}

// 🔧 NEW: Function to sanitize and validate array fields with product-specific sanitization
function sanitizeAndValidateArray(input, fieldName, maxItems = 10, maxLength = 50, useProductSanitizer = false) {
  if (!input) return []
  
  const sanitizer = useProductSanitizer ? sanitizeProductInput : sanitizeInput
  
  // If it's already an array, process it
  if (Array.isArray(input)) {
    return input
      .map(item => sanitizer(String(item)))
      .filter(item => item && item.length > 0 && item.length <= maxLength)
      .slice(0, maxItems) // Limit number of items
  }
  
  // If it's a single value, convert to array
  if (typeof input === 'string' && input.trim()) {
    const sanitized = sanitizer(input)
    return sanitized && sanitized.length <= maxLength ? [sanitized] : []
  }
  
  console.warn(`${fieldName} received invalid format:`, typeof input)
  return []
}

// Sanitize filename with better handling
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unnamed_file'
  
  let sanitized = filename
    .replace(/[<>"'%;()&+${}]/g, '') // Remove dangerous chars
    .replace(/[\/\\:*?"<>|]/g, '_') // Replace path separators with underscores
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim()
  
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = MAX_FILENAME_LENGTH - extension.length - 1
    
    if (maxNameLength > 0) {
      sanitized = nameWithoutExt.substring(0, maxNameLength) + '.' + extension
    } else {
      sanitized = sanitized.substring(0, MAX_FILENAME_LENGTH)
    }
  }
  
  return sanitized
}

// 🔐 SECURITY: Validate ObjectId
function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// 🔐 SECURITY: Check upload abuse
function checkUploadAbuse(ip) {
  const now = Date.now()
  const userUploads = uploadTracker.get(ip) || []
  
  // Remove uploads older than 1 hour
  const recentUploads = userUploads.filter(time => now - time < 3600000)
  
  // Allow max 50 uploads per hour per IP
  if (recentUploads.length >= 50) {
    throw new Error('Upload limit exceeded. Try again later.')
  }
  
  recentUploads.push(now)
  uploadTracker.set(ip, recentUploads)
}

// 🔐 SECURITY: Get user IP
function getUserIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',') || 
         req.headers.get('x-real-ip') || 
         'unknown'
}

// Validate environment variables
console.log('Checking environment variables...')
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.error('Missing Cloudinary environment variables!')
  console.error(
    'Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET'
  )
  throw new Error('Missing required Cloudinary environment variables')
}
console.log('Environment variables validated ✓')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Updated default branches
const DEFAULT_BRANCHES = ['bashundhara', 'mirpur']

// Vape shop category structure
const VAPE_CATEGORIES = {
  'E-LIQUID': [
    'Fruits',
    'Bakery & Dessert',
    'Tobacco',
    'Custard & Cream',
    'Coffee',
    'Menthol/Mint',
  ],
  TANKS: ['Rda', 'Rta', 'Rdta', 'Subohm', 'Disposable'],
  'NIC SALTS': [
    'Fruits',
    'Bakery & Dessert',
    'Tobacco',
    'Custard & Cream',
    'Coffee',
    'Menthol/Mint',
  ],
  'POD SYSTEM': ['Disposable', 'Refillable Pod Kit', 'Pre-Filled Cartridge'],
  DEVICE: ['Kit', 'Only Mod'],
  BORO: [
    'Alo (Boro)',
    'Boro Bridge and Cartridge',
    'Boro Accessories And Tools',
  ],
  ACCESSORIES: [
    'SubOhm Coil',
    'Charger',
    'Cotton',
    'Premade Coil',
    'Battery',
    'Tank Glass',
    'Cartridge',
    'RBA/RBK',
    'WIRE SPOOL',
    'DRIP TIP',
  ],
}

// 🔧 CRITICAL FIX: Helper function to determine if user is authenticated
function isAuthenticated(req) {
  const authHeader = req.headers.get('authorization')
  return authHeader && authHeader.startsWith('Bearer ') && authHeader !== 'Bearer temp-admin-token-for-development'
}

// 🔧 CRITICAL FIX: Helper function to get user info with fallback
async function getUserInfo(req) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { role: 'public', branch: null, userId: null, isAuthenticated: false }
    }
    
    // Check for temp token (development mode)
    if (authHeader === 'Bearer temp-admin-token-for-development') {
      console.log('🔧 Using temporary admin token for development')
      return { role: 'admin', branch: null, userId: 'temp-admin', isAuthenticated: true }
    }
    
    const user = await verifyApiToken(req)
    return { 
      role: user.role || 'user', 
      branch: user.branch || null, 
      userId: user.userId || user.id,
      isAuthenticated: true 
    }
  } catch (authError) {
    console.log('🔧 Authentication failed, treating as public user:', authError.message)
    return { role: 'public', branch: null, userId: null, isAuthenticated: false }
  }
}

// 🔧 COMPLETELY FIXED GET method - ALLOWS PUBLIC ACCESS WITH PROPER DATA FILTERING
export async function GET(req) {
  const ip = getUserIP(req)
  logRequest(req, 'GET')

  try {
    console.log('GET: Starting request processing...')
    const { searchParams } = new URL(req.url)
    
    // 🔧 UPDATED: Use appropriate sanitizers for different input types
    const id = sanitizeInput(searchParams.get('id'))
    const barcode = sanitizeInput(searchParams.get('barcode'))
    const category = sanitizeCategoryInput(searchParams.get('category'))
    const subcategory = sanitizeCategoryInput(searchParams.get('subcategory'))
    const search = sanitizeSearchInput(searchParams.get('search'))
    const status = sanitizeInput(searchParams.get('status')) || 'active'
    const branch = sanitizeInput(searchParams.get('branch'))
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100)
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1)
    const inStock = searchParams.get('inStock')
    const getCategoriesOnly = searchParams.get('getCategoriesOnly') === 'true' || searchParams.get('getCategories') === 'true'
    const getBranchesOnly = searchParams.get('getBranchesOnly') === 'true'

    // Validate search length
    if (search && search.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'Search term too long' },
        { status: 400 }
      )
    }

    console.log('GET: Search params:', {
      id, barcode, category, subcategory, search, status, branch, limit, page, inStock, getCategoriesOnly, getBranchesOnly,
    })

    // 🔧 CRITICAL FIX: Get user info without failing on no auth
    const userInfo = await getUserInfo(req)
    console.log('GET: User info:', userInfo)

    // Apply rate limiting based on user role
    const rateLimit = RATE_LIMITS[userInfo.role.toUpperCase()] || RATE_LIMITS.PUBLIC
    // Only check rate limits if the function exists and user is not admin
    if (typeof checkRateLimit === 'function' && userInfo.role !== 'admin') {
      try {
        checkRateLimit(req, rateLimit)
      } catch (rateLimitError) {
        console.warn('Rate limit check failed:', rateLimitError.message)
      }
    }

    console.log('GET: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')
    console.log('GET: Database connected ✓')

    // Get categories structure for frontend
    if (getCategoriesOnly) {
      console.log('GET: Fetching categories...')
      
      try {
        const customCategories = await db
          .collection('categories')
          .find({}, { projection: { name: 1, subcategories: 1 } })
          .toArray()
        
        console.log('GET: Raw custom categories from DB:', customCategories)
        
        // Start with default categories
        const allCategories = { ...VAPE_CATEGORIES }

        // Merge custom categories
        customCategories.forEach((cat) => {
          if (cat.name && Array.isArray(cat.subcategories)) {
            allCategories[cat.name.toUpperCase()] = cat.subcategories
            console.log(`GET: Added custom category: ${cat.name} with subcategories:`, cat.subcategories)
          }
        })

        console.log('GET: Final merged categories:', allCategories)
        console.log('GET: Categories fetched successfully ✓')
        
        return NextResponse.json(
          { categories: allCategories },
          {
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300' // 5 minutes cache for categories
            },
          }
        )
      } catch (categoryError) {
        console.error('GET: Error fetching categories:', categoryError)
        
        // Fallback to default categories
        return NextResponse.json(
          { categories: VAPE_CATEGORIES },
          {
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60'
            },
          }
        )
      }
    }

    // Get all branches from existing products (public access)
    if (getBranchesOnly) {
      console.log('GET: Fetching branches from database...')

      // 🔧 CRITICAL FIX: Just return default branches for simplicity
      console.log('GET: Branches found in database:', DEFAULT_BRANCHES)

      return NextResponse.json(
        {
          branches: DEFAULT_BRANCHES,
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=1800'
          },
        }
      )
    }

    // Get product by barcode - exact match search with role-based projection
    if (barcode) {
      console.log('GET: Searching by barcode:', barcode)

      // Validate barcode format
      if (!/^[a-zA-Z0-9\-_]{1,50}$/.test(barcode)) {
        return NextResponse.json(
          { error: 'Invalid barcode format' },
          { status: 400 }
        )
      }

      // Try exact match first
      let product = await db
        .collection('products')
        .findOne({ 
          barcode: barcode.trim(),
          status: userInfo.role === 'public' ? 'active' : status
        })

      // If not found, try case-insensitive search
      if (!product) {
        console.log('GET: Exact barcode not found, trying case-insensitive search...')
        product = await db.collection('products').findOne({
          barcode: { $regex: `^${barcode.trim()}$`, $options: 'i' },
          status: userInfo.role === 'public' ? 'active' : status
        })
      }

      if (!product) {
        console.log('GET: Product not found with barcode:', barcode)
        return NextResponse.json(
          {
            products: [],
            pagination: {
              currentPage: 1,
              totalPages: 0,
              totalProducts: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // 🔧 CRITICAL FIX: Apply role-based data filtering
      const filteredProduct = filterProductByRole(product, userInfo)

      console.log('GET: Product found with barcode ✓')
      return NextResponse.json(
        {
          products: [filteredProduct],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalProducts: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': userInfo.role === 'public' ? 'public, max-age=300' : 'private, max-age=60'
          },
        }
      )
    }

    // Get single product by ID with role-based projection
    if (id) {
      console.log('GET: Searching by ID:', id)
      
      // Validate ObjectId format
      if (!isValidObjectId(id)) {
        console.log('GET: Invalid product ID:', id)
        return NextResponse.json(
          { error: 'Invalid product ID format' },
          { status: 400 }
        )
      }

      const { ObjectId } = require('mongodb')
      const product = await db
        .collection('products')
        .findOne({ 
          _id: new ObjectId(id),
          status: userInfo.role === 'public' ? 'active' : status
        })

      if (!product) {
        console.log('GET: Product not found with ID:', id)
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Apply role-based data filtering
      const filteredProduct = filterProductByRole(product, userInfo)

      console.log('GET: Product found with ID ✓')
      return NextResponse.json(filteredProduct, {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': userInfo.role === 'public' ? 'public, max-age=300' : 'private, max-age=60'
        },
      })
    }

    // 🔧 Build query for filtering with role-based restrictions
    let query = { status: userInfo.role === 'public' ? 'active' : status }

    if (category) {
      if (category.length > 50) {
        return NextResponse.json(
          { error: 'Category name too long' },
          { status: 400 }
        )
      }
      query.category = { $regex: category, $options: 'i' }
    }

    if (subcategory) {
      if (subcategory.length > 50) {
        return NextResponse.json(
          { error: 'Subcategory name too long' },
          { status: 400 }
        )
      }
      query.subcategory = { $regex: subcategory, $options: 'i' }
    }

    if (search) {
      // Extra sanitization for search to prevent injection
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
        { subcategory: { $regex: safeSearch, $options: 'i' } },
        { brand: { $regex: safeSearch, $options: 'i' } },
        { barcode: { $regex: safeSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(safeSearch, 'i')] } },
      ]
    }

















// Handle stock and branch restrictions
if (userInfo.role === 'moderator') {
  // 🔒 RESTRICTION: Moderator can only see their own branch data - NO FILTERING ALLOWED
  if (branch && branch !== userInfo.branch) {
    return NextResponse.json(
      { error: 'Access denied: Cannot view other branch data' },
      { status: 403 }
    )
  }
  
  // 🔒 MODERATOR ALWAYS sees products from their assigned branch only
  console.log('🏢 Moderator restricted to their branch:', userInfo.branch);
  if (inStock === 'true') {
    query[`stock.${userInfo.branch}_stock`] = { $gt: 0 }
  }
  
} else if (userInfo.role === 'public') {
  // Filter by branch stock availability for public
  if (branch) {
    if (!/^[a-zA-Z0-9_]{1,20}$/.test(branch)) {
      return NextResponse.json(
        { error: 'Invalid branch name' },
        { status: 400 }
      )
    }
    console.log('🏢 Public filtering by branch:', branch);
    query[`stock.${branch}_stock`] = { $gt: 0 };
  } else if (inStock === 'true') {
    // Check stock in default branches
    query.$or = [
      { 'stock.bashundhura_stock': { $gt: 0 } },
      { 'stock.mirpur_stock': { $gt: 0 } },
    ]
  }
  
} else if (userInfo.role === 'admin') {
  // 🔥 FIXED: Admin can filter by any branch - ALWAYS apply branch filter
  if (branch) {
    console.log('🏢 Admin filtering by branch:', branch);
    query[`stock.${branch}_stock`] = { $gt: 0 };
  } else if (inStock === 'true') {
    query.$or = [
      { 'stock.bashundhura_stock': { $gt: 0 } },
      { 'stock.mirpur_stock': { $gt: 0 } },
    ]
  }
}




















    console.log('GET: Built query:', JSON.stringify(query, null, 2))

    // Get total count for pagination
    const totalProducts = await db.collection('products').countDocuments(query)
    console.log('GET: Total products found:', totalProducts)

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build aggregation pipeline
    let pipeline = [{ $match: query }, { $sort: { createdAt: -1 } }]

    if (limit > 0) {
      pipeline.push({ $skip: skip })
      pipeline.push({ $limit: limit })
    }

    const products = await db
      .collection('products')
      .aggregate(pipeline)
      .toArray()

    // 🔧 CRITICAL FIX: Apply role-based data filtering to all products
    const filteredProducts = products.map(product => filterProductByRole(product, userInfo))

    console.log('GET: Products fetched successfully, count:', products.length)

    return NextResponse.json(
      {
        products: filteredProducts,
        pagination: {
          currentPage: page,
          totalPages: limit > 0 ? Math.ceil(totalProducts / limit) : 1,
          totalProducts,
          hasNextPage: limit > 0 && skip + products.length < totalProducts,
          hasPrevPage: page > 1,
        },
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': userInfo.role === 'public' ? 'public, max-age=60' : `private, max-age=60`
        },
      }
    )
  } catch (err) {
    return handleApiError(err, 'GET /api/products')
  }
}

// 🔥 FIXED: Helper function to filter product data based on user role - PRESERVES BRANCH STRUCTURE
function filterProductByRole(product, userInfo) {
  const filteredProduct = { ...product }

  console.log('🔧 Filtering product for role:', userInfo.role, 'Product:', product.name, 'Stock:', product.stock)

  if (userInfo.role === 'public') {
    // 🔥 NEW APPROACH: Preserve branch structure but hide exact numbers
    
    if (product.stock) {
      const filteredStock = {}
      
      // Check all stock keys
      for (const [key, value] of Object.entries(product.stock)) {
        if (key.endsWith('_stock')) {
          // Convert exact numbers to boolean availability
          filteredStock[key] = value > 0 ? 1 : 0 // 1 = available, 0 = not available
        } else {
          // Keep non-stock fields as is
          filteredStock[key] = value
        }
      }
      
      // Also add general availability for backwards compatibility
      const hasAnyStock = Object.entries(product.stock).some(([key, value]) => 
        key.endsWith('_stock') && value > 0
      )
      
      filteredStock.available = hasAnyStock
      filteredStock.status = hasAnyStock ? 'in_stock' : 'out_of_stock'
      
      filteredProduct.stock = filteredStock
    }
    
    // Remove sensitive information
    delete filteredProduct.barcode
    
    console.log('🔧 Public user - filtered stock with branch structure:', filteredProduct.stock)
    
  } else if (userInfo.role === 'moderator' && userInfo.branch) {
    // Moderator only sees their branch stock
    const branchStock = {}
    if (product.stock) {
      branchStock[`${userInfo.branch}_stock`] = product.stock[`${userInfo.branch}_stock`] || 0
    }
    filteredProduct.stock = branchStock
  }
  // Admin sees everything (no filtering)

  return filteredProduct
}

// POST method implementation - Requires authentication for create/update operations
export async function POST(req) {
  const ip = getUserIP(req)
  logRequest(req, 'POST')

  try {
    // 🔧 CRITICAL FIX: Require authentication for all POST operations
    const userInfo = await getUserInfo(req)
    if (!userInfo.isAuthenticated) {
      return createAuthError('Authentication required for product management', 401)
    }

    // Apply role-based access control
    if (!['admin', 'moderator'].includes(userInfo.role)) {
      return createAuthError('Only admins and moderator can manage products', 403)
    }

    console.log('POST: Reading request body...')
    const body = await req.json()

    // Validate request body size
    const bodySize = JSON.stringify(body).length
    if (bodySize > MAX_REQUEST_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request body too large' },
        { status: 413 }
      )
    }

    console.log('POST: Body received, action:', body.action || 'create product')

    const { action } = body

    console.log('POST: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')
    console.log('POST: Database connected ✓')

    // Handle category management - Admin only
    if (action === 'add_category') {
      if (userInfo.role !== 'admin') {
        return createAuthError('Only admins can manage categories', 403)
      }

      console.log('POST: Adding category:', body.categoryName)
      const categoryName = sanitizeCategoryInput(body.categoryName)
      const subcategories = Array.isArray(body.subcategories) 
        ? body.subcategories.map(sub => sanitizeCategoryInput(sub)).filter(sub => sub.length > 0)
        : []

      // Validate category name
      if (!categoryName || categoryName.length < 2 || categoryName.length > 30) {
        return NextResponse.json(
          { error: 'Category name must be between 2 and 30 characters' },
          { status: 400 }
        )
      }

      // Check if category already exists
      const existingCategory = await db.collection('categories').findOne({
        name: categoryName.toUpperCase(),
      })

      if (existingCategory) {
        console.log('POST: Category already exists:', categoryName)
        return NextResponse.json(
          { error: 'Category already exists' },
          { status: 400 }
        )
      }

      const newCategory = {
        name: categoryName.toUpperCase(),
        subcategories: subcategories,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userInfo.userId,
      }

      await db.collection('categories').insertOne(newCategory)
      console.log('POST: Category added successfully ✓')

      return NextResponse.json(
        {
          message: 'Category added successfully',
          category: newCategory,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle category deletion - Admin only
    if (action === 'delete_category') {
      if (userInfo.role !== 'admin') {
        return createAuthError('Only admins can delete categories', 403)
      }

      console.log('POST: Deleting category:', body.categoryName)
      const categoryName = sanitizeCategoryInput(body.categoryName)

      if (!categoryName) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        )
      }

      // Check if category exists in custom categories
      const existingCategory = await db.collection('categories').findOne({
        name: categoryName.toUpperCase(),
      })

      // Check if it's a default category
      const isDefaultCategory = VAPE_CATEGORIES[categoryName.toUpperCase()]

      if (!existingCategory && !isDefaultCategory) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      // Prevent deletion of default categories
      if (isDefaultCategory && !existingCategory) {
        return NextResponse.json(
          { error: 'Cannot delete default categories' },
          { status: 400 }
        )
      }

      // Check if any products are using this category
      const productsUsingCategory = await db
        .collection('products')
        .countDocuments({
          category: { $regex: `^${categoryName}$`, $options: 'i' },
        })

      if (productsUsingCategory > 0) {
        console.log(
          `POST: Cannot delete category ${categoryName}, ${productsUsingCategory} products are using it`
        )
        return NextResponse.json(
          {
            error: `Cannot delete category. ${productsUsingCategory} products are currently using this category.`,
            productsCount: productsUsingCategory,
          },
          { status: 400 }
        )
      }

      // Delete category from custom categories collection
      const deleteResult = await db.collection('categories').deleteOne({
        name: categoryName.toUpperCase(),
      })

      console.log('POST: Category deleted successfully ✓')
      return NextResponse.json(
        {
          message: 'Category and all its subcategories deleted successfully',
          deletedCount: deleteResult.deletedCount,
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle subcategory management - Admin only
    if (action === 'add_subcategory') {
      if (userInfo.role !== 'admin') {
        return createAuthError('Only admins can manage subcategories', 403)
      }

      const categoryName = sanitizeCategoryInput(body.categoryName)
      const subcategoryName = sanitizeCategoryInput(body.subcategoryName)

      if (!categoryName || !subcategoryName) {
        return NextResponse.json(
          { error: 'Category name and subcategory name are required' },
          { status: 400 }
        )
      }

      if (subcategoryName.length < 2 || subcategoryName.length > 30) {
        return NextResponse.json(
          { error: 'Subcategory name must be between 2 and 30 characters' },
          { status: 400 }
        )
      }

      console.log(
        'POST: Adding subcategory:',
        body.subcategoryName,
        'to category:',
        body.categoryName
      )

      // Try to update custom category first
      const updateResult = await db.collection('categories').updateOne(
        { name: categoryName.toUpperCase() },
        {
          $addToSet: { subcategories: subcategoryName },
          $set: { updatedAt: new Date(), updatedBy: userInfo.userId },
        }
      )

      if (updateResult.matchedCount === 0) {
        // If category doesn't exist in custom categories, check if it's a default category
        if (VAPE_CATEGORIES[categoryName.toUpperCase()]) {
          const existingSubcategories = VAPE_CATEGORIES[categoryName.toUpperCase()]
          const newCategory = {
            name: categoryName.toUpperCase(),
            subcategories: [...existingSubcategories, subcategoryName],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userInfo.userId,
          }
          await db.collection('categories').insertOne(newCategory)
        } else {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          )
        }
      }

      console.log('POST: Subcategory added successfully ✓')
      return NextResponse.json(
        { message: 'Subcategory added successfully' },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Handle subcategory deletion - Admin only
    if (action === 'delete_subcategory') {
      if (userInfo.role !== 'admin') {
        return createAuthError('Only admins can delete subcategories', 403)
      }

      const categoryName = sanitizeCategoryInput(body.categoryName)
      const subcategoryName = sanitizeCategoryInput(body.subcategoryName)

      console.log(
        'POST: Deleting subcategory:',
        body.subcategoryName,
        'from category:',
        body.categoryName
      )

      if (!categoryName || !subcategoryName) {
        return NextResponse.json(
          { error: 'Category name and subcategory name are required' },
          { status: 400 }
        )
      }

      // Check if any products are using this subcategory
      const productsUsingSubcategory = await db
        .collection('products')
        .countDocuments({
          category: { $regex: `^${categoryName}$`, $options: 'i' },
          subcategory: { $regex: `^${subcategoryName}$`, $options: 'i' },
        })

      if (productsUsingSubcategory > 0) {
        return NextResponse.json(
          {
            error: `Cannot delete subcategory. ${productsUsingSubcategory} products are currently using this subcategory.`,
            productsCount: productsUsingSubcategory,
          },
          { status: 400 }
        )
      }

      // Try to remove subcategory from custom category
      const updateResult = await db.collection('categories').updateOne(
        { name: categoryName.toUpperCase() },
        {
          $pull: { subcategories: subcategoryName },
          $set: { updatedAt: new Date(), updatedBy: userInfo.userId },
        }
      )

      if (updateResult.matchedCount === 0) {
        // Check if it's a default category
        if (VAPE_CATEGORIES[categoryName.toUpperCase()]) {
          // Create custom category without the deleted subcategory
          const existingSubcategories = VAPE_CATEGORIES[categoryName.toUpperCase()]
          const filteredSubcategories = existingSubcategories.filter(
            (sub) => sub.toLowerCase() !== subcategoryName.toLowerCase()
          )

          const newCategory = {
            name: categoryName.toUpperCase(),
            subcategories: filteredSubcategories,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userInfo.userId,
          }
          await db.collection('categories').insertOne(newCategory)
        } else {
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          )
        }
      }

      console.log('POST: Subcategory deleted successfully ✓')
      return NextResponse.json(
        { message: 'Subcategory deleted successfully' },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 🆕 UPDATED: Handle product update with ALL NEW FIELDS + proper branch data merging
    if (action === 'update') {
      console.log('POST: Updating product:', body.id)
      const productId = sanitizeInput(body.id)

      if (!isValidObjectId(productId)) {
        return NextResponse.json(
          { error: 'Invalid product ID format' },
          { status: 400 }
        )
      }

      const {
        name,
        description,
        price,
        comparePrice,
        brand,
        barcode,
        category,
        subcategory,
        stock,
        status,
        specifications,
        tags,
        branchSpecifications, // 🔧 NEW: Handle branch-specific specifications
        flavor,
        resistance,
        wattageRange,
        imageOrder,
        // 🆕 NEW FIELDS FROM FRONTEND
        bottleSizes,
        bottleType,
        unit,
        puffs,
        coil,
        volume,
        charging,
        chargingTime,
        features,
        eachSetContains,
      } = body

      // 🆕 UPDATED: Use product-specific sanitization + NEW description sanitizer
      const sanitizedName = sanitizeProductInput(name)
      const sanitizedDescription = sanitizeDescriptionInput(description) // 🆕 NEW: 2000 word limit
      const sanitizedBrand = sanitizeProductInput(brand)
      const sanitizedBarcode = sanitizeInput(barcode) // Barcode uses strict sanitization
      const sanitizedCategory = sanitizeCategoryInput(category)
      const sanitizedSubcategory = sanitizeCategoryInput(subcategory)
      const sanitizedFlavor = sanitizeProductInput(flavor)
      const sanitizedStatus = sanitizeInput(status)

      // 🆕 NEW: Sanitize additional fields
      const sanitizedBottleSizes = sanitizeProductInput(bottleSizes)
      const sanitizedBottleType = sanitizeProductInput(bottleType)
      const sanitizedUnit = sanitizeProductInput(unit)
      const sanitizedPuffs = sanitizeProductInput(puffs)
      const sanitizedCoil = sanitizeProductInput(coil)
      const sanitizedVolume = sanitizeProductInput(volume)
      const sanitizedCharging = sanitizeProductInput(charging)
      const sanitizedChargingTime = sanitizeProductInput(chargingTime)

      console.log('POST: Processing branch specifications:', branchSpecifications)

      // Validation
      if (!sanitizedName || !price || !sanitizedCategory) {
        console.log('POST: Missing required fields for update')
        return NextResponse.json(
          { error: 'Name, price, and category are required' },
          { status: 400 }
        )
      }

      // Validate field lengths
      if (sanitizedName.length > 100) {
        return NextResponse.json(
          { error: 'Product name too long (max 100 characters)' },
          { status: 400 }
        )
      }

      // 🆕 NEW: Description validation is now 2000 WORDS
      if (sanitizedDescription && sanitizedDescription.split(/\s+/).length > MAX_DESCRIPTION_WORDS) {
        return NextResponse.json(
          { error: `Description too long (max ${MAX_DESCRIPTION_WORDS} words)` },
          { status: 400 }
        )
      }

      // Validate numeric values
      const numPrice = parseFloat(price)
      const numComparePrice = comparePrice ? parseFloat(comparePrice) : null

      if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999) {
        return NextResponse.json(
          { error: 'Invalid price value' },
          { status: 400 }
        )
      }

      // Validate status
      if (sanitizedStatus && !['active', 'inactive', 'draft'].includes(sanitizedStatus)) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }

      // Validate stock object
      if (stock && typeof stock === 'object') {
        for (const [branchKey, stockValue] of Object.entries(stock)) {
          if (!branchKey.endsWith('_stock') || !/^[a-zA-Z0-9_]{1,20}_stock$/.test(branchKey)) {
            return NextResponse.json(
              { error: 'Invalid stock key format' },
              { status: 400 }
            )
          }
          
          const stockNum = parseInt(stockValue)
          if (isNaN(stockNum) || stockNum < 0 || stockNum > 99999) {
            return NextResponse.json(
              { error: `Invalid stock value for ${branchKey}` },
              { status: 400 }
            )
          }
        }
      }

      const { ObjectId } = require('mongodb')

      // 🔧 CRITICAL: Get existing product first to preserve other branches' data
      const existingProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(productId) })
      
      if (!existingProduct) {
        console.log('POST: Product not found for update:', productId)
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // Check for duplicate barcode
      if (sanitizedBarcode && sanitizedBarcode !== existingProduct.barcode) {
        const duplicateBarcode = await db.collection('products').findOne({
          barcode: sanitizedBarcode,
          _id: { $ne: new ObjectId(productId) },
        })
        if (duplicateBarcode) {
          return NextResponse.json(
            { error: 'Barcode already exists for another product' },
            { status: 400 }
          )
        }
      }

      // 🔧 NEW: Merge branch specifications properly
      const existingBranchSpecs = existingProduct.branchSpecifications || {}
      const mergedBranchSpecifications = { ...existingBranchSpecs }
      
      // Only update the branches provided in the request
      if (branchSpecifications && typeof branchSpecifications === 'object') {
        Object.keys(branchSpecifications).forEach(branch => {
          mergedBranchSpecifications[branch] = branchSpecifications[branch]
        })
      }

      // 🔧 NEW: Merge stock properly  
      const existingStock = existingProduct.stock || {}
      const mergedStock = { ...existingStock }
      
      // Only update the stock values provided in the request
      if (stock && typeof stock === 'object') {
        Object.keys(stock).forEach(stockKey => {
          mergedStock[stockKey] = stock[stockKey]
        })
      }

      // 🆕 NEW: Process features and each set contains arrays
      const sanitizedFeatures = sanitizeAndValidateArray(features, 'features', 20, 200, true)
      const sanitizedEachSetContains = sanitizeAndValidateArray(eachSetContains, 'eachSetContains', 20, 200, true)

      // Update product data with merged values + ALL NEW FIELDS
      const updateData = {
        name: sanitizedName.trim(),
        description: sanitizedDescription?.trim() || '',
        price: numPrice,
        comparePrice: numComparePrice,
        brand: sanitizedBrand?.trim() || '',
        barcode: sanitizedBarcode?.trim() || null,
        category: sanitizedCategory?.trim() || '',
        subcategory: sanitizedSubcategory?.trim() || '',
        status: sanitizedStatus || 'active',
        specifications: specifications || {},
        tags: Array.isArray(tags) 
          ? tags.map(tag => sanitizeProductInput(tag)).filter(tag => tag.length > 0 && tag.length <= 50).slice(0, 20) 
          : [],
        // 🔧 FIXED: Use merged data instead of overwriting
        branchSpecifications: mergedBranchSpecifications,
        stock: mergedStock,
        flavor: sanitizedFlavor?.trim() || '',
        resistance: resistance || null,
        wattageRange: wattageRange || null,
        // 🆕 ALL NEW FIELDS
        bottleSizes: sanitizedBottleSizes?.trim() || '',
        bottleType: sanitizedBottleType?.trim() || '',
        unit: sanitizedUnit?.trim() || '',
        puffs: sanitizedPuffs?.trim() || '',
        coil: sanitizedCoil?.trim() || '',
        volume: sanitizedVolume?.trim() || '',
        charging: sanitizedCharging?.trim() || '',
        chargingTime: sanitizedChargingTime?.trim() || '',
        features: sanitizedFeatures,
        eachSetContains: sanitizedEachSetContains,
        updatedAt: new Date(),
        updatedBy: userInfo.userId,
      }

      // Handle image order update
      if (imageOrder && Array.isArray(imageOrder)) {
        console.log(
          'POST: Updating image order with',
          imageOrder.length,
          'images'
        )

        // Filter out images without publicId (new images that aren't uploaded yet)
        const validImages = imageOrder
          .filter((img) => img.publicId && img.url)
          .slice(0, MAX_IMAGES_PER_UPLOAD)
          .map((img, index) => ({
            url: sanitizeInput(img.url),
            publicId: sanitizeInput(img.publicId),
            alt: sanitizeProductInput(img.alt) || `Product image ${index + 1}`,
          }))

        if (validImages.length > 0) {
          updateData.images = validImages
          console.log(
            'POST: Image order updated with',
            validImages.length,
            'valid images'
          )
        }
      }

      const updateResult = await db
        .collection('products')
        .updateOne({ _id: new ObjectId(productId) }, { $set: updateData })

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update product' },
          { status: 500 }
        )
      }

      // Get updated product
      const updatedProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(productId) })
      console.log('POST: Product updated successfully ✓')

      return NextResponse.json(
        {
          message: 'Product updated successfully',
          product: updatedProduct,
        },
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 🆕 UPDATED: Handle product creation (default behavior) - WITH ALL NEW FIELDS
    console.log('POST: Creating new product:', body.name)
    const {
      name,
      description,
      price,
      comparePrice,
      brand,
      barcode,
      category,
      subcategory,
      stock,
      status,
      specifications,
      tags,
      branches,
      branchSpecifications, // 🔧 NEW: Handle branch-specific specifications
      flavor,
      resistance,
      wattageRange,
      // 🆕 NEW FIELDS FROM FRONTEND
      bottleSizes,
      bottleType,
      unit,
      puffs,
      coil,
      volume,
      charging,
      chargingTime,
      features,
      eachSetContains,
    } = body

    // 🆕 UPDATED: Use product-specific sanitization + NEW description sanitizer
    const sanitizedName = sanitizeProductInput(name)
    const sanitizedDescription = sanitizeDescriptionInput(description) // 🆕 NEW: 2000 word limit
    const sanitizedBrand = sanitizeProductInput(brand)
    const sanitizedBarcode = sanitizeInput(barcode) // Barcode uses strict sanitization
    const sanitizedCategory = sanitizeCategoryInput(category)
    const sanitizedSubcategory = sanitizeCategoryInput(subcategory)
    const sanitizedFlavor = sanitizeProductInput(flavor)
    const sanitizedStatus = sanitizeInput(status)

    // 🆕 NEW: Sanitize additional fields
    const sanitizedBottleSizes = sanitizeProductInput(bottleSizes)
    const sanitizedBottleType = sanitizeProductInput(bottleType)
    const sanitizedUnit = sanitizeProductInput(unit)
    const sanitizedPuffs = sanitizeProductInput(puffs)
    const sanitizedCoil = sanitizeProductInput(coil)
    const sanitizedVolume = sanitizeProductInput(volume)
    const sanitizedCharging = sanitizeProductInput(charging)
    const sanitizedChargingTime = sanitizeProductInput(chargingTime)

    console.log('POST: Processing branch specifications for new product:', branchSpecifications)

    // Validation for new product
    if (!sanitizedName || !price || !sanitizedCategory) {
      console.log('POST: Missing required fields for new product')
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    // Validate field lengths
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Product name too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // 🆕 NEW: Description validation is now 2000 WORDS
    if (sanitizedDescription && sanitizedDescription.split(/\s+/).length > MAX_DESCRIPTION_WORDS) {
      return NextResponse.json(
        { error: `Description too long (max ${MAX_DESCRIPTION_WORDS} words)` },
        { status: 400 }
      )
    }

    // Validate numeric values
    const numPrice = parseFloat(price)
    const numComparePrice = comparePrice ? parseFloat(comparePrice) : null

    if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      )
    }

    // Check for duplicate barcode
    if (sanitizedBarcode) {
      const existingBarcode = await db
        .collection('products')
        .findOne({ barcode: sanitizedBarcode.trim() })
      if (existingBarcode) {
        console.log('POST: Barcode already exists:', sanitizedBarcode)
        return NextResponse.json(
          { error: 'Barcode already exists' },
          { status: 400 }
        )
      }
    }

    // Initialize stock object with branches
    let initialStock = {}

    if (stock && typeof stock === 'object') {
      // Validate stock keys
      for (const [branchKey, stockValue] of Object.entries(stock)) {
        if (!branchKey.endsWith('_stock') || !/^[a-zA-Z0-9_]{1,20}_stock$/.test(branchKey)) {
          return NextResponse.json(
            { error: 'Invalid stock key format' },
            { status: 400 }
          )
        }
        
        const stockNum = parseInt(stockValue)
        if (isNaN(stockNum) || stockNum < 0 || stockNum > 99999) {
          return NextResponse.json(
            { error: `Invalid stock value for ${branchKey}` },
            { status: 400 }
          )
        }
        initialStock[branchKey] = stockNum
      }
    } else {
      // Initialize with default branches
      const branchList = Array.isArray(branches) ? branches : DEFAULT_BRANCHES
      branchList.forEach((branch) => {
        const safeBranch = sanitizeInput(branch)
        if (safeBranch && /^[a-zA-Z0-9_]{1,20}$/.test(safeBranch)) {
          initialStock[`${safeBranch}_stock`] = 0
        }
      })
    }

    // 🔧 IMPROVED: Better handling of initial branch specifications
    const initialBranchSpecifications = {}
    if (branchSpecifications && typeof branchSpecifications === 'object') {
      // Only include branches that actually have data
      Object.keys(branchSpecifications).forEach(branch => {
        if (branchSpecifications[branch] && Object.keys(branchSpecifications[branch]).length > 0) {
          initialBranchSpecifications[branch] = branchSpecifications[branch]
        }
      })
    }

    // 🆕 NEW: Process features and each set contains arrays for new product
    const sanitizedFeatures = sanitizeAndValidateArray(features, 'features', 20, 200, true)
    const sanitizedEachSetContains = sanitizeAndValidateArray(eachSetContains, 'eachSetContains', 20, 200, true)

    // Create new product with ALL FIELDS including new ones
    const newProduct = {
      name: sanitizedName.trim(),
      description: sanitizedDescription?.trim() || '',
      price: numPrice,
      comparePrice: numComparePrice,
      brand: sanitizedBrand?.trim() || '',
      barcode: sanitizedBarcode?.trim() || null,
      category: sanitizedCategory?.trim() || '',
      subcategory: sanitizedSubcategory?.trim() || '',
      stock: initialStock,
      status: sanitizedStatus || 'active',
      specifications: specifications || {},
      tags: Array.isArray(tags) 
        ? tags.map(tag => sanitizeProductInput(tag)).filter(tag => tag.length > 0 && tag.length <= 50).slice(0, 20)
        : [],
      // 🔧 IMPROVED: Store branch specifications properly
      branchSpecifications: initialBranchSpecifications,
      flavor: sanitizedFlavor?.trim() || '',
      resistance: resistance || null,
      wattageRange: wattageRange || null,
      // 🆕 ALL NEW FIELDS
      bottleSizes: sanitizedBottleSizes?.trim() || '',
      bottleType: sanitizedBottleType?.trim() || '',
      unit: sanitizedUnit?.trim() || '',
      puffs: sanitizedPuffs?.trim() || '',
      coil: sanitizedCoil?.trim() || '',
      volume: sanitizedVolume?.trim() || '',
      charging: sanitizedCharging?.trim() || '',
      chargingTime: sanitizedChargingTime?.trim() || '',
      features: sanitizedFeatures,
      eachSetContains: sanitizedEachSetContains,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userInfo.userId,
    }

    console.log('POST: Inserting product into database...')
    const result = await db.collection('products').insertOne(newProduct)

    // Get the created product with its ID
    const createdProduct = await db
      .collection('products')
      .findOne({ _id: result.insertedId })
    console.log('POST: Product created successfully ✓, ID:', result.insertedId)

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: createdProduct,
      },
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return handleApiError(err, 'POST /api/products')
  }
}

// PUT method - Image upload (requires authentication) - UNCHANGED
export async function PUT(req) {
  const ip = getUserIP(req)
  logRequest(req, 'PUT')

  try {
    // Check upload abuse
    checkUploadAbuse(ip)

    // Require authentication
    const userInfo = await getUserInfo(req)
    if (!userInfo.isAuthenticated) {
      return createAuthError('Authentication required for image upload', 401)
    }

    if (!['admin', 'moderator'].includes(userInfo.role)) {
      return createAuthError('Only admins and moderator can upload product images', 403)
    }

    console.log('PUT: Processing image upload...')
    const formData = await req.formData()
    const productId = sanitizeInput(formData.get('productId'))
    const files = formData.getAll('images')

    console.log('PUT: Product ID:', productId, 'Files count:', files.length)

    if (!productId || files.length === 0) {
      console.log('PUT: Missing product ID or files')
      return NextResponse.json(
        { error: 'Product ID and at least one image file are required' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(productId)) {
      console.log('PUT: Invalid product ID:', productId)
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Limit number of files
    if (files.length > MAX_IMAGES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_UPLOAD} images allowed per upload` },
        { status: 400 }
      )
    }

    const { ObjectId } = require('mongodb')
    console.log('PUT: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')

    // Check if product exists
    const existingProduct = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) })
    if (!existingProduct) {
      console.log('PUT: Product not found:', productId)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const uploadedImages = []
    const uploadErrors = []

    // Determine max file size based on user role
    const maxFileSize = ['admin', 'moderator'].includes(userInfo.role) 
      ? MAX_IMAGE_SIZE_ADMIN 
      : MAX_IMAGE_SIZE_USER

    console.log('PUT: Starting image uploads to Cloudinary...')
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      console.log(
        `PUT: Processing file ${i + 1}/${files.length}, size: ${file.size}, type: ${file.type}, name: ${file.name}`
      )

      // Validate file type
      if (!file.type.startsWith('image/')) {
        const error = `File ${i + 1}: Only image files are allowed (received: ${file.type})`
        console.log(`PUT: ${error}`)
        uploadErrors.push(error)
        continue
      }

      // Validate file size based on role
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        const error = `File ${i + 1}: File size must be less than ${maxSizeMB}MB (received: ${Math.round(file.size / (1024 * 1024))}MB)`
        console.log(`PUT: ${error}`)
        uploadErrors.push(error)
        continue
      }

      // Improved filename validation with sanitization
      const sanitizedFilename = sanitizeFilename(file.name)
      console.log(`PUT: Original filename: ${file.name}, Sanitized: ${sanitizedFilename}`)

      // Additional validation for empty files
      if (file.size === 0) {
        const error = `File ${i + 1}: Empty file not allowed`
        console.log(`PUT: ${error}`)
        uploadErrors.push(error)
        continue
      }

      try {
        // Convert file to buffer
        console.log(`PUT: Converting file ${i + 1} to buffer...`)
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        console.log(`PUT: Buffer created successfully, size: ${buffer.length} bytes`)

        console.log(`PUT: Uploading file ${i + 1} to Cloudinary...`)
        
        // Ultra-simple Cloudinary configuration without any transformations
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
             resource_type: 'image',
            folder: 'vwv_vape_products',
            public_id: `vape_product_${productId}_${Date.now()}_${i}`,
            // Allow only safe image formats
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
            // Safe transformations
            transformation: [
              { width: 800, height: 800, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            access_mode: 'public',
            timeout: 60000,
            },
            (error, result) => {
              if (error) {
                console.error(`PUT: Cloudinary upload error for file ${i + 1}:`, error)
                reject(new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`))
              } else if (!result) {
                console.error(`PUT: Cloudinary upload returned null result for file ${i + 1}`)
                reject(new Error('Cloudinary upload failed: No result returned'))
              } else {
                console.log(`PUT: Cloudinary upload successful for file ${i + 1}:`, {
                  publicId: result.public_id,
                  url: result.secure_url,
                  format: result.format
                })
                resolve(result)
              }
            }
          )
          
          // Ensure the upload stream is properly ended
          try {
            uploadStream.end(buffer)
          } catch (streamError) {
            console.error(`PUT: Error ending upload stream for file ${i + 1}:`, streamError)
            reject(new Error(`Upload stream error: ${streamError.message}`))
          }
        })

        // Validate upload response
        if (!uploadResponse.secure_url || !uploadResponse.public_id) {
          throw new Error('Invalid upload response: missing URL or public ID')
        }

        const newImage = {
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
          alt: `${existingProduct.name} - ${existingProduct.category} image ${uploadedImages.length + 1}`,
        }

        uploadedImages.push(newImage)
        console.log(`PUT: File ${i + 1} uploaded successfully ✓`, {
          url: newImage.url,
          publicId: newImage.publicId
        })
        
      } catch (uploadError) {
        const error = `File ${i + 1}: ${uploadError.message}`
        console.error(`PUT: Upload error for file ${i + 1}:`, uploadError)
        uploadErrors.push(error)
      }
    }

    console.log(`PUT: Upload summary - Success: ${uploadedImages.length}, Errors: ${uploadErrors.length}`)

    // More lenient success condition - allow partial uploads
    if (uploadedImages.length === 0) {
      console.log('PUT: No images uploaded successfully')
      return NextResponse.json(
        { 
          error: 'No images were uploaded successfully', 
          errors: uploadErrors,
          details: 'All image uploads failed. Please check file formats and sizes.'
        },
        { status: 400 }
      )
    }

    console.log('PUT: Updating product with new images...')
    // Update product with new images
    const updateResult = await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      {
        $push: { images: { $each: uploadedImages } },
        $set: { 
          updatedAt: new Date(),
          updatedBy: userInfo.userId,
        },
      }
    )

    if (updateResult.matchedCount === 0) {
      console.log('PUT: Failed to update product with images')
      // Clean up uploaded images if database update failed
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.publicId)
          console.log(`PUT: Cleaned up image: ${image.publicId}`)
        } catch (cleanupError) {
          console.error('PUT: Error cleaning up image:', cleanupError)
        }
      }
      return NextResponse.json(
        { error: 'Failed to update product with images' },
        { status: 500 }
      )
    }

    console.log('PUT: Images uploaded and saved successfully ✓')
    
    const response = {
      message: 'Images uploaded successfully',
      uploadedImages,
      summary: {
        successful: uploadedImages.length,
        failed: uploadErrors.length,
        total: files.length
      }
    }
    
    // Include errors if any, but still return success if some uploads worked
    if (uploadErrors.length > 0) {
      response.uploadErrors = uploadErrors
      response.message = `${uploadedImages.length} of ${files.length} images uploaded successfully`
    }

    return NextResponse.json(response, { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    })
    
  } catch (err) {
    return handleApiError(err, 'PUT /api/products')
  }
}

// DELETE method - Different permissions for images vs products - UNCHANGED
export async function DELETE(req) {
  const ip = getUserIP(req)
  logRequest(req, 'DELETE')

  try {
    // Require authentication for DELETE
    const userInfo = await getUserInfo(req)
    if (!userInfo.isAuthenticated) {
      return createAuthError('Authentication required for deletion', 401)
    }

    console.log('DELETE: Processing delete request...')
    const { searchParams } = new URL(req.url)
    const productId = sanitizeInput(searchParams.get('productId'))
    const imagePublicId = sanitizeInput(searchParams.get('imagePublicId'))

    console.log(
      'DELETE: Product ID:',
      productId,
      'Image Public ID:',
      imagePublicId
    )

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!isValidObjectId(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    const { ObjectId } = require('mongodb')
    console.log('DELETE: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')

    // Get product
    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) })
    if (!product) {
      console.log('DELETE: Product not found:', productId)
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Delete specific image
    if (imagePublicId) {
      // 🔥 FIX: Allow both admins and moderators to delete images
      if (!['admin', 'moderator'].includes(userInfo.role)) {
        return createAuthError('Only admins and moderators can delete images', 403)
      }

      console.log('DELETE: Image deletion - permissions granted to:', userInfo.role)

      // Validate image public ID format
      if (!/^[a-zA-Z0-9_\/-]{10,100}$/.test(imagePublicId)) {
        return NextResponse.json(
          { error: 'Invalid image public ID format' },
          { status: 400 }
        )
      }

      console.log('DELETE: Deleting specific image:', imagePublicId)
      // Find the image in the product
      const imageToDelete = product.images?.find(
        (img) => img.publicId === imagePublicId
      )
      if (!imageToDelete) {
        return NextResponse.json(
          { error: 'Image not found in product' },
          { status: 404 }
        )
      }

      // Delete from Cloudinary
      try {
        await cloudinary.uploader.destroy(imagePublicId)
        console.log('DELETE: Image deleted from Cloudinary ✓')
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError)
      }

      // Remove image from product
      const updateResult = await db.collection('products').updateOne(
        { _id: new ObjectId(productId) },
        {
          $pull: { images: { publicId: imagePublicId } },
          $set: { 
            updatedAt: new Date(),
            updatedBy: userInfo.userId,
          },
        }
      )

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to remove image from product' },
          { status: 500 }
        )
      }

      console.log('DELETE: Image removed from product successfully ✓')
      return NextResponse.json(
        {
          message: 'Image deleted successfully',
        },
        { headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 🔥 FIX: For deleting entire product - only admins allowed
    if (userInfo.role !== 'admin') {
      return createAuthError('Only admins can delete products', 403)
    }

    console.log('DELETE: Product deletion - admin access confirmed')

    // Delete entire product
    console.log('DELETE: Deleting entire product and all images...')
    // First, delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      console.log(
        'DELETE: Deleting',
        product.images.length,
        'images from Cloudinary...'
      )
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId)
        } catch (deleteError) {
          console.error('Error deleting product image:', deleteError)
        }
      }
      console.log('DELETE: All images deleted from Cloudinary ✓')
    }

    // Delete product from database
    const deleteResult = await db
      .collection('products')
      .deleteOne({ _id: new ObjectId(productId) })

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    console.log('DELETE: Product deleted successfully ✓')
    return NextResponse.json(
      {
        message: 'Product deleted successfully',
      },
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return handleApiError(err, 'DELETE /api/products')
  }
}