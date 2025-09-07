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
const MAX_FILENAME_LENGTH = 255 // 🔧 FIX: Increased from 100 to 255 characters

// Rate limiting per role
const RATE_LIMITS = {
  PUBLIC: { requests: 200, windowMs: 60000 },
  ADMIN: { requests: 500, windowMs: 60000 },
  MODERATOR: { requests: 300, windowMs: 60000 },
  MANAGER: { requests: 400, windowMs: 60000 },
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
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
            req.headers.get('x-real-ip') || 
            'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  console.log(`[${timestamp}] ${method} /api/products - IP: ${ip} - UserAgent: ${userAgent.substring(0, 100)}`)
  console.log('URL:', req.url)
}

// 🔐 SECURITY: Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/[<>"'%;()&+${}]/g, '') // Remove dangerous chars
    .replace(/javascript:/gi, '') // Remove JS protocols
    .replace(/data:/gi, '') // Remove data URLs
    .trim()
    .substring(0, 1000) // Limit length
}

// 🔧 FIX: Sanitize filename with better handling
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'unnamed_file'
  
  // Remove path separators and dangerous characters
  let sanitized = filename
    .replace(/[<>"'%;()&+${}]/g, '') // Remove dangerous chars
    .replace(/[\/\\:*?"<>|]/g, '_') // Replace path separators with underscores
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .trim()
  
  // If filename is too long, truncate it but keep extension
  if (sanitized.length > MAX_FILENAME_LENGTH) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = MAX_FILENAME_LENGTH - extension.length - 1 // -1 for the dot
    
    if (maxNameLength > 0) {
      sanitized = nameWithoutExt.substring(0, maxNameLength) + '.' + extension
    } else {
      // If extension is too long, just truncate the whole filename
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
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
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

// 🔧 UPDATED: Default branches changed to bashundhara and mirpur
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
    'SibOhm Coil',
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

// GET method implementation (unchanged - working properly)
export async function GET(req) {
  const ip = getUserIP(req)
  logRequest(req, 'GET')

  try {
    console.log('GET: Starting request processing...')
    const { searchParams } = new URL(req.url)
    
    // 🔐 SECURITY: Sanitize all inputs
    const id = sanitizeInput(searchParams.get('id'))
    const barcode = sanitizeInput(searchParams.get('barcode'))
    const category = sanitizeInput(searchParams.get('category'))
    const subcategory = sanitizeInput(searchParams.get('subcategory'))
    const search = sanitizeInput(searchParams.get('search'))
    const status = sanitizeInput(searchParams.get('status')) || 'active'
    const branch = sanitizeInput(searchParams.get('branch'))
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100)
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1)
    const inStock = searchParams.get('inStock')
    // 🔧 FIX: Check for both parameter variations
    const getCategoriesOnly = searchParams.get('getCategoriesOnly') === 'true' || searchParams.get('getCategories') === 'true'
    const getBranchesOnly = searchParams.get('getBranchesOnly') === 'true'

    // 🔐 SECURITY: Validate search length
    if (search && search.length > MAX_SEARCH_LENGTH) {
      return NextResponse.json(
        { error: 'Search term too long' },
        { status: 400 }
      )
    }

    console.log('GET: Search params:', {
      id, barcode, category, subcategory, search, status, branch, limit, page, inStock, getCategoriesOnly, getBranchesOnly,
    })

    // 🔐 SECURITY: Check for authentication token and apply role-based rate limiting
    let user = null
    let userRole = 'public'
    let userBranch = null

    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        user = await verifyApiToken(req)
        userRole = user.role
        userBranch = user.branch
        
        // Apply role-based rate limiting
        const rateLimit = RATE_LIMITS[userRole.toUpperCase()] || RATE_LIMITS.PUBLIC
        checkRateLimit(req, rateLimit)
      } catch (authError) {
        // Invalid token, treat as public user
        console.warn('Invalid token:', authError.message)
        checkRateLimit(req, RATE_LIMITS.PUBLIC)
        userRole = 'public'
      }
    } else {
      // No token, apply public rate limiting
      checkRateLimit(req, RATE_LIMITS.PUBLIC)
    }

    console.log('GET: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')
    console.log('GET: Database connected ✓')

    // 🔧 FIX: Get categories structure for frontend with proper data transformation
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

        // 🔧 FIX: Properly merge custom categories with correct field names
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
      console.log('GET: Fetching branches...')

      const products = await db
        .collection('products')
        .find(
          { status: 'active' },
          { projection: { stock: 1 } }
        )
        .toArray()

      const branchesSet = new Set()

      products.forEach((product) => {
        if (product.stock) {
          Object.keys(product.stock).forEach((stockKey) => {
            if (stockKey.endsWith('_stock')) {
              const branchName = stockKey.replace('_stock', '')
              branchesSet.add(branchName)
            }
          })
        }
      })

      const branches = Array.from(branchesSet)
      console.log('GET: Branches fetched successfully ✓')

      return NextResponse.json(
        {
          branches: branches.length > 0 ? branches : DEFAULT_BRANCHES,
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=1800'
          },
        }
      )
    }

    // 🔐 SECURITY: Get product by barcode - exact match search with role-based projection
    if (barcode) {
      console.log('GET: Searching by barcode:', barcode)

      // 🔐 SECURITY: Validate barcode format (assuming alphanumeric)
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
          status: userRole === 'public' ? 'active' : status // Public users only see active products
        })

      // If not found, try case-insensitive search
      if (!product) {
        console.log(
          'GET: Exact barcode not found, trying case-insensitive search...'
        )
        product = await db.collection('products').findOne({
          barcode: { $regex: `^${barcode.trim()}$`, $options: 'i' },
          status: userRole === 'public' ? 'active' : status
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

      // 🔐 SECURITY: Filter data based on user role
      if (userRole === 'public') {
        delete product.stock
        delete product.barcode
        delete product.status
      } else if (userRole === 'moderator' && userBranch) {
        // Moderator only sees their branch stock
        const branchStock = {}
        branchStock[`${userBranch}_stock`] = product.stock?.[`${userBranch}_stock`] || 0
        product.stock = branchStock
      }

      console.log('GET: Product found with barcode ✓')
      return NextResponse.json(
        {
          products: [product],
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
            'Cache-Control': userRole === 'public' ? 'public, max-age=300' : 'private, max-age=60'
          },
        }
      )
    }

    // Get single product by ID with role-based projection
    if (id) {
      console.log('GET: Searching by ID:', id)
      
      // 🔐 SECURITY: Validate ObjectId format
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
          status: userRole === 'public' ? 'active' : status
        })

      if (!product) {
        console.log('GET: Product not found with ID:', id)
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }

      // 🔐 SECURITY: Filter data based on user role
      if (userRole === 'public') {
        delete product.stock
        delete product.barcode
        delete product.status
      } else if (userRole === 'moderator' && userBranch) {
        // Moderator only sees their branch stock
        const branchStock = {}
        branchStock[`${userBranch}_stock`] = product.stock?.[`${userBranch}_stock`] || 0
        product.stock = branchStock
      }

      console.log('GET: Product found with ID ✓')
      return NextResponse.json(product, {
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': userRole === 'public' ? 'public, max-age=300' : 'private, max-age=60'
        },
      })
    }

    // 🔐 SECURITY: Build query for filtering with role-based restrictions
    let query = { status: userRole === 'public' ? 'active' : status }

    if (category) {
      // 🔐 SECURITY: Validate category input
      if (category.length > 50) {
        return NextResponse.json(
          { error: 'Category name too long' },
          { status: 400 }
        )
      }
      query.category = { $regex: category, $options: 'i' }
    }

    if (subcategory) {
      // 🔐 SECURITY: Validate subcategory input
      if (subcategory.length > 50) {
        return NextResponse.json(
          { error: 'Subcategory name too long' },
          { status: 400 }
        )
      }
      query.subcategory = { $regex: subcategory, $options: 'i' }
    }

    if (search) {
      // 🔐 SECURITY: Sanitize search to prevent injection
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

    // 🔐 SECURITY: Handle stock and branch restrictions
    if (userRole === 'moderator') {
      // Moderator can only see their branch data
      if (branch && branch !== userBranch) {
        return NextResponse.json(
          { error: 'Access denied: Cannot view other branch data' },
          { status: 403 }
        )
      }
      if (inStock === 'true') {
        query[`stock.${userBranch}_stock`] = { $gt: 0 }
      }
    } else if (userRole === 'public') {
      // Filter by branch stock availability for public
      if (branch && inStock === 'true') {
        if (!/^[a-zA-Z0-9_]{1,20}$/.test(branch)) {
          return NextResponse.json(
            { error: 'Invalid branch name' },
            { status: 400 }
          )
        }
        query[`stock.${branch}_stock`] = { $gt: 0 }
      } else if (inStock === 'true') {
        // 🔧 UPDATED: Check stock in updated default branches
        query.$or = [
          { 'stock.bashundhara_stock': { $gt: 0 } },
          { 'stock.mirpur_stock': { $gt: 0 } },
        ]
      }
    } else if (userRole === 'admin') {
      // Admin can filter by any branch
      if (branch && inStock === 'true') {
        query[`stock.${branch}_stock`] = { $gt: 0 }
      } else if (inStock === 'true') {
        query.$or = [
          { 'stock.bashundhara_stock': { $gt: 0 } },
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

    // 🔐 SECURITY: Filter sensitive data based on user role
    products.forEach(product => {
      if (userRole === 'public') {
        delete product.stock
        delete product.barcode
        delete product.status
      } else if (userRole === 'moderator' && userBranch) {
        // Moderator only sees their branch stock
        const branchStock = {}
        branchStock[`${userBranch}_stock`] = product.stock?.[`${userBranch}_stock`] || 0
        product.stock = branchStock
      }
      // Admin sees everything (no filtering)
    })

    console.log('GET: Products fetched successfully, count:', products.length)

    return NextResponse.json(
      {
        products,
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
          'Cache-Control': userRole === 'public' ? 'public, max-age=60' : `private, max-age=60`
        },
      }
    )
  } catch (err) {
    return handleApiError(err, 'GET /api/products')
  }
}

// POST method implementation (unchanged - working properly)
export async function POST(req) {
  const ip = getUserIP(req)
  logRequest(req, 'POST')

  try {
    // 🔐 SECURITY: Require authentication for all POST operations
    let user = null
    try {
      user = await verifyApiToken(req)
      checkRateLimit(req, RATE_LIMITS[user.role.toUpperCase()] || RATE_LIMITS.PUBLIC)
    } catch (authError) {
      return createAuthError('Authentication required for product management', 401)
    }

    console.log('POST: Reading request body...')
    const body = await req.json()

    // 🔐 SECURITY: Validate request body size
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

    // Handle category management - Admin only (existing category logic preserved)
    if (action === 'add_category') {
      try {
        requireRole(user, ['admin'])
      } catch (roleError) {
        return createAuthError('Only admins can manage categories', 403)
      }

      console.log('POST: Adding category:', body.categoryName)
      const categoryName = sanitizeInput(body.categoryName)
      const subcategories = Array.isArray(body.subcategories) 
        ? body.subcategories.map(sub => sanitizeInput(sub)).filter(sub => sub.length > 0)
        : []

      // 🔐 SECURITY: Validate category name
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
        createdBy: user.userId,
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

    // Handle category deletion - Admin only (existing logic preserved)
    if (action === 'delete_category') {
      try {
        requireRole(user, ['admin'])
      } catch (roleError) {
        return createAuthError('Only admins can delete categories', 403)
      }

      console.log('POST: Deleting category:', body.categoryName)
      const categoryName = sanitizeInput(body.categoryName)

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

    // Handle subcategory management - Admin only (existing subcategory logic preserved)
    if (action === 'add_subcategory') {
      try {
        requireRole(user, ['admin'])
      } catch (roleError) {
        return createAuthError('Only admins can manage subcategories', 403)
      }

      const categoryName = sanitizeInput(body.categoryName)
      const subcategoryName = sanitizeInput(body.subcategoryName)

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
          $set: { updatedAt: new Date(), updatedBy: user.userId },
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
            createdBy: user.userId,
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

    // Handle subcategory deletion - Admin only (existing logic preserved)
    if (action === 'delete_subcategory') {
      try {
        requireRole(user, ['admin'])
      } catch (roleError) {
        return createAuthError('Only admins can delete subcategories', 403)
      }

      const categoryName = sanitizeInput(body.categoryName)
      const subcategoryName = sanitizeInput(body.subcategoryName)

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
          $set: { updatedAt: new Date(), updatedBy: user.userId },
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
            createdBy: user.userId,
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

    // Handle product update - Admin/Manager only (existing logic preserved)
    if (action === 'update') {
      try {
        requireRole(user, ['admin', 'manager'])
      } catch (roleError) {
        return createAuthError('Only admins and managers can update products', 403)
      }

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
        nicotineStrength,
        vgPgRatio,
        flavor,
        resistance,
        wattageRange,
        imageOrder,
      } = body

      // 🔐 SECURITY: Sanitize and validate all inputs
      const sanitizedName = sanitizeInput(name)
      const sanitizedDescription = sanitizeInput(description)
      const sanitizedBrand = sanitizeInput(brand)
      const sanitizedBarcode = sanitizeInput(barcode)
      const sanitizedCategory = sanitizeInput(category)
      const sanitizedSubcategory = sanitizeInput(subcategory)
      const sanitizedFlavor = sanitizeInput(flavor)
      const sanitizedStatus = sanitizeInput(status)

      // Validation
      if (!sanitizedName || !price || !sanitizedCategory) {
        console.log('POST: Missing required fields for update')
        return NextResponse.json(
          { error: 'Name, price, and category are required' },
          { status: 400 }
        )
      }

      // 🔐 SECURITY: Validate field lengths
      if (sanitizedName.length > 100) {
        return NextResponse.json(
          { error: 'Product name too long (max 100 characters)' },
          { status: 400 }
        )
      }

      if (sanitizedDescription && sanitizedDescription.length > 2000) {
        return NextResponse.json(
          { error: 'Description too long (max 2000 characters)' },
          { status: 400 }
        )
      }

      // 🔐 SECURITY: Validate numeric values
      const numPrice = parseFloat(price)
      const numComparePrice = comparePrice ? parseFloat(comparePrice) : null

      if (isNaN(numPrice) || numPrice < 0 || numPrice > 999999) {
        return NextResponse.json(
          { error: 'Invalid price value' },
          { status: 400 }
        )
      }

      // 🔐 SECURITY: Validate status
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

      // Check if product exists
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

      // Update product data
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
          ? tags.map(tag => sanitizeInput(tag)).filter(tag => tag.length > 0 && tag.length <= 50).slice(0, 20) 
          : [],
        nicotineStrength: nicotineStrength || null,
        vgPgRatio: vgPgRatio || null,
        flavor: sanitizedFlavor?.trim() || '',
        resistance: resistance || null,
        wattageRange: wattageRange || null,
        updatedAt: new Date(),
        updatedBy: user.userId,
      }

      // Handle stock update
      if (stock && typeof stock === 'object') {
        updateData.stock = stock
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
            alt: sanitizeInput(img.alt) || `Product image ${index + 1}`,
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

    // Handle product creation (default behavior) - Admin/Manager only (existing logic preserved)
    try {
      requireRole(user, ['admin', 'manager'])
    } catch (roleError) {
      return createAuthError('Only admins and managers can create products', 403)
    }

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
      nicotineStrength,
      vgPgRatio,
      flavor,
      resistance,
      wattageRange,
    } = body

    // 🔐 SECURITY: Sanitize and validate all inputs for new product
    const sanitizedName = sanitizeInput(name)
    const sanitizedDescription = sanitizeInput(description)
    const sanitizedBrand = sanitizeInput(brand)
    const sanitizedBarcode = sanitizeInput(barcode)
    const sanitizedCategory = sanitizeInput(category)
    const sanitizedSubcategory = sanitizeInput(subcategory)
    const sanitizedFlavor = sanitizeInput(flavor)
    const sanitizedStatus = sanitizeInput(status)

    // Validation for new product
    if (!sanitizedName || !price || !sanitizedCategory) {
      console.log('POST: Missing required fields for new product')
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    // 🔐 SECURITY: Validate field lengths
    if (sanitizedName.length > 100) {
      return NextResponse.json(
        { error: 'Product name too long (max 100 characters)' },
        { status: 400 }
      )
    }

    if (sanitizedDescription && sanitizedDescription.length > 2000) {
      return NextResponse.json(
        { error: 'Description too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // 🔐 SECURITY: Validate numeric values
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
      // 🔧 UPDATED: Initialize with updated default branches
      const branchList = Array.isArray(branches) ? branches : DEFAULT_BRANCHES
      branchList.forEach((branch) => {
        const safeBranch = sanitizeInput(branch)
        if (safeBranch && /^[a-zA-Z0-9_]{1,20}$/.test(safeBranch)) {
          initialStock[`${safeBranch}_stock`] = 0
        }
      })
    }

    // Create new product
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
        ? tags.map(tag => sanitizeInput(tag)).filter(tag => tag.length > 0 && tag.length <= 50).slice(0, 20)
        : [],
      nicotineStrength: nicotineStrength || null,
      vgPgRatio: vgPgRatio || null,
      flavor: sanitizedFlavor?.trim() || '',
      resistance: resistance || null,
      wattageRange: wattageRange || null,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.userId,
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

// 🔧 COMPLETELY FIXED PUT method - Simplified Cloudinary configuration
export async function PUT(req) {
  const ip = getUserIP(req)
  logRequest(req, 'PUT')

  try {
    // 🔐 SECURITY: Check upload abuse
    checkUploadAbuse(ip)

    // 🔐 SECURITY: Require authentication
    let user = null
    try {
      user = await verifyApiToken(req)
      requireRole(user, ['admin', 'manager'])
      checkRateLimit(req, RATE_LIMITS[user.role.toUpperCase()] || RATE_LIMITS.PUBLIC)
    } catch (authError) {
      return createAuthError('Only admins and managers can upload product images', 403)
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

    // 🔐 SECURITY: Limit number of files
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

    // 🔐 SECURITY: Determine max file size based on user role
    const maxFileSize = ['admin', 'moderator'].includes(user.role) 
      ? MAX_IMAGE_SIZE_ADMIN 
      : MAX_IMAGE_SIZE_USER

    console.log('PUT: Starting image uploads to Cloudinary...')
    // 🔧 COMPLETELY FIXED: Simplified Cloudinary upload without any transformations
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      console.log(
        `PUT: Processing file ${i + 1}/${files.length}, size: ${file.size}, type: ${file.type}, name: ${file.name}`
      )

      // 🔐 SECURITY: Validate file type
      if (!file.type.startsWith('image/')) {
        const error = `File ${i + 1}: Only image files are allowed (received: ${file.type})`
        console.log(`PUT: ${error}`)
        uploadErrors.push(error)
        continue
      }

      // 🔐 SECURITY: Validate file size based on role
      if (file.size > maxFileSize) {
        const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
        const error = `File ${i + 1}: File size must be less than ${maxSizeMB}MB (received: ${Math.round(file.size / (1024 * 1024))}MB)`
        console.log(`PUT: ${error}`)
        uploadErrors.push(error)
        continue
      }

      // 🔧 FIX: Improved filename validation with sanitization
      const sanitizedFilename = sanitizeFilename(file.name)
      console.log(`PUT: Original filename: ${file.name}, Sanitized: ${sanitizedFilename}`)

      // 🔧 FIX: Additional validation for empty files
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
        
        // 🔧 COMPLETELY FIXED: Ultra-simple Cloudinary configuration without any transformations
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
             resource_type: 'image',
            folder: 'vwv_vape_products',
            public_id: `vape_product_${productId}_${Date.now()}_${i}`,
            // 🔧 SECURE: Allow only safe image formats
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'],
            // 🔧 SAFE TRANSFORMATIONS: Use fetch_format instead of format
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
          
          // 🔧 FIX: Ensure the upload stream is properly ended
          try {
            uploadStream.end(buffer)
          } catch (streamError) {
            console.error(`PUT: Error ending upload stream for file ${i + 1}:`, streamError)
            reject(new Error(`Upload stream error: ${streamError.message}`))
          }
        })

        // 🔧 FIX: Validate upload response
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

    // 🔧 FIX: More lenient success condition - allow partial uploads
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
          updatedBy: user.userId,
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

// DELETE method implementation (unchanged - working properly)
export async function DELETE(req) {
  const ip = getUserIP(req)
  logRequest(req, 'DELETE')

  try {
    // 🔐 SECURITY: Require admin authentication for DELETE
    let user = null
    try {
      user = await verifyApiToken(req)
      requireRole(user, ['admin']) // Only admins can delete
      checkRateLimit(req, RATE_LIMITS.ADMIN)
    } catch (authError) {
      return createAuthError('Only admins can delete products or images', 403)
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
      // 🔐 SECURITY: Validate image public ID format
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
            updatedBy: user.userId,
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
