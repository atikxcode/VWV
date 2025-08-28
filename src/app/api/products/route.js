// src/app/api/products/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Enhanced error handling wrapper
function handleApiError(error, context = '') {
  console.error(`API Error in ${context}:`, error)
  console.error('Error stack:', error.stack)

  return NextResponse.json(
    {
      error: error.message || 'Internal server error',
      context: context,
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

// Request logging helper
function logRequest(req, method) {
  console.log(`${method} /api/products called at ${new Date().toISOString()}`)
  console.log('URL:', req.url)
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

// Default branches
const DEFAULT_BRANCHES = ['ghatpar', 'mirpur']

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

// GET: return all products OR get product by ID/search/barcode with branch-specific stock
export async function GET(req) {
  logRequest(req, 'GET')

  try {
    console.log('GET: Starting request processing...')
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const barcode = searchParams.get('barcode')
    const category = searchParams.get('category')
    const subcategory = searchParams.get('subcategory')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const branch = searchParams.get('branch')
    const limit = parseInt(searchParams.get('limit')) || 0
    const page = parseInt(searchParams.get('page')) || 1
    const inStock = searchParams.get('inStock')
    const getCategoriesOnly = searchParams.get('getCategoriesOnly')

    console.log('GET: Search params:', {
      id,
      barcode,
      category,
      subcategory,
      search,
      status,
      branch,
      limit,
      page,
      inStock,
      getCategoriesOnly,
    })

    console.log('GET: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')
    console.log('GET: Database connected ✓')

    // Get categories structure for frontend
    if (getCategoriesOnly === 'true') {
      console.log('GET: Fetching categories...')
      const customCategories = await db
        .collection('categories')
        .find()
        .toArray()
      const allCategories = { ...VAPE_CATEGORIES }

      customCategories.forEach((cat) => {
        allCategories[cat.name] = cat.subcategories
      })

      console.log('GET: Categories fetched successfully ✓')
      return NextResponse.json(
        { categories: allCategories },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get product by barcode
    if (barcode) {
      console.log('GET: Searching by barcode:', barcode)
      const product = await db
        .collection('products')
        .findOne({ barcode: barcode })
      if (!product) {
        console.log('GET: Product not found with barcode:', barcode)
        return NextResponse.json(
          { error: 'Product not found with this barcode' },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      console.log('GET: Product found with barcode ✓')
      return NextResponse.json(product, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get single product by ID
    if (id) {
      console.log('GET: Searching by ID:', id)
      const { ObjectId } = require('mongodb')
      if (!ObjectId.isValid(id)) {
        console.log('GET: Invalid product ID:', id)
        return NextResponse.json(
          { error: 'Invalid product ID' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      const product = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })
      if (!product) {
        console.log('GET: Product not found with ID:', id)
        return NextResponse.json(
          { error: 'Product not found' },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
      console.log('GET: Product found with ID ✓')
      return NextResponse.json(product, {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Build query for filtering
    let query = {}

    if (category) {
      query.category = { $regex: category, $options: 'i' }
    }

    if (subcategory) {
      query.subcategory = { $regex: subcategory, $options: 'i' }
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { subcategory: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ]
    }

    if (status) {
      query.status = status
    }

    // Filter by branch stock availability
    if (branch && inStock === 'true') {
      query[`stock.${branch}_stock`] = { $gt: 0 }
    }

    console.log('GET: Built query:', query)

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
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return handleApiError(err, 'GET /api/products')
  }
}

// POST: create new product, update product, or manage categories
export async function POST(req) {
  logRequest(req, 'POST')

  try {
    console.log('POST: Reading request body...')
    const body = await req.json()
    console.log('POST: Body received, action:', body.action || 'create product')

    const { action } = body

    console.log('POST: Connecting to database...')
    const client = await clientPromise
    const db = client.db('VWV')
    console.log('POST: Database connected ✓')

    // Handle category management
    if (action === 'add_category') {
      console.log('POST: Adding category:', body.categoryName)
      const { categoryName, subcategories } = body

      if (!categoryName) {
        console.log('POST: Category name missing')
        return NextResponse.json(
          { error: 'Category name is required' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
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
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const newCategory = {
        name: categoryName.toUpperCase(),
        subcategories: Array.isArray(subcategories) ? subcategories : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection('categories').insertOne(newCategory)
      console.log('POST: Category added successfully ✓')

      return NextResponse.json(
        {
          message: 'Category added successfully',
          category: newCategory,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle subcategory management
    if (action === 'add_subcategory') {
      console.log(
        'POST: Adding subcategory:',
        body.subcategoryName,
        'to category:',
        body.categoryName
      )
      const { categoryName, subcategoryName } = body

      if (!categoryName || !subcategoryName) {
        console.log('POST: Category or subcategory name missing')
        return NextResponse.json(
          {
            error: 'Category name and subcategory name are required',
          },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Try to update custom category first
      const updateResult = await db.collection('categories').updateOne(
        { name: categoryName.toUpperCase() },
        {
          $addToSet: { subcategories: subcategoryName },
          $set: { updatedAt: new Date() },
        }
      )

      if (updateResult.matchedCount === 0) {
        // If category doesn't exist in custom categories, check if it's a default category
        if (VAPE_CATEGORIES[categoryName.toUpperCase()]) {
          const existingSubcategories =
            VAPE_CATEGORIES[categoryName.toUpperCase()]
          const newCategory = {
            name: categoryName.toUpperCase(),
            subcategories: [...existingSubcategories, subcategoryName],
            createdAt: new Date(),
            updatedAt: new Date(),
          }
          await db.collection('categories').insertOne(newCategory)
        } else {
          console.log('POST: Category not found:', categoryName)
          return NextResponse.json(
            { error: 'Category not found' },
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }

      console.log('POST: Subcategory added successfully ✓')
      return NextResponse.json(
        { message: 'Subcategory added successfully' },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle product update
    if (action === 'update') {
      console.log('POST: Updating product:', body.id)
      const {
        id,
        name,
        description,
        price,
        comparePrice,
        brand,
        sku,
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
      } = body

      if (!id) {
        console.log('POST: Product ID missing for update')
        return NextResponse.json(
          { error: 'Product ID is required for update' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Validation
      if (!name || !price || !category) {
        console.log('POST: Missing required fields for update')
        return NextResponse.json(
          { error: 'Name, price, and category are required' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      if (price < 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Validate stock object
      if (stock && typeof stock === 'object') {
        for (const [branchKey, stockValue] of Object.entries(stock)) {
          if (!branchKey.endsWith('_stock')) {
            return NextResponse.json(
              {
                error:
                  'Stock keys must end with "_stock" (e.g., "ghatpar_stock")',
              },
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }
          if (stockValue < 0) {
            return NextResponse.json(
              { error: `Stock for ${branchKey} must be a positive number` },
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }
        }
      }

      const { ObjectId } = require('mongodb')
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Check if product exists
      const existingProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })
      if (!existingProduct) {
        console.log('POST: Product not found for update:', id)
        return NextResponse.json(
          { error: 'Product not found' },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Check for duplicate SKU or barcode
      if (sku && sku !== existingProduct.sku) {
        const duplicateSku = await db.collection('products').findOne({
          sku: sku,
          _id: { $ne: new ObjectId(id) },
        })
        if (duplicateSku) {
          return NextResponse.json(
            { error: 'SKU already exists for another product' },
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }

      if (barcode && barcode !== existingProduct.barcode) {
        const duplicateBarcode = await db.collection('products').findOne({
          barcode: barcode,
          _id: { $ne: new ObjectId(id) },
        })
        if (duplicateBarcode) {
          return NextResponse.json(
            { error: 'Barcode already exists for another product' },
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }

      // Update product
      const updateData = {
        name: name.trim(),
        description: description?.trim() || '',
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        brand: brand?.trim() || '',
        sku: sku?.trim() || null,
        barcode: barcode?.trim() || null,
        category: category?.trim() || '',
        subcategory: subcategory?.trim() || '',
        status: status || 'active',
        specifications: specifications || {},
        tags: Array.isArray(tags) ? tags.filter((tag) => tag.trim()) : [],
        nicotineStrength: nicotineStrength || null,
        vgPgRatio: vgPgRatio || null,
        flavor: flavor?.trim() || '',
        resistance: resistance || null,
        wattageRange: wattageRange || null,
        updatedAt: new Date(),
      }

      // Handle stock update
      if (stock && typeof stock === 'object') {
        updateData.stock = stock
      }

      const updateResult = await db
        .collection('products')
        .updateOne({ _id: new ObjectId(id) }, { $set: updateData })

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to update product' },
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Get updated product
      const updatedProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })
      console.log('POST: Product updated successfully ✓')

      return NextResponse.json(
        {
          message: 'Product updated successfully',
          product: updatedProduct,
        },
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Handle product creation (default behavior)
    console.log('POST: Creating new product:', body.name)
    const {
      name,
      description,
      price,
      comparePrice,
      brand,
      sku,
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

    // Validation for new product
    if (!name || !price || !category) {
      console.log('POST: Missing required fields for new product')
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check for duplicate SKU or barcode if provided
    if (sku) {
      const existingSku = await db
        .collection('products')
        .findOne({ sku: sku.trim() })
      if (existingSku) {
        console.log('POST: SKU already exists:', sku)
        return NextResponse.json(
          { error: 'SKU already exists' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    if (barcode) {
      const existingBarcode = await db
        .collection('products')
        .findOne({ barcode: barcode.trim() })
      if (existingBarcode) {
        console.log('POST: Barcode already exists:', barcode)
        return NextResponse.json(
          { error: 'Barcode already exists' },
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Initialize stock object with branches
    let initialStock = {}

    if (stock && typeof stock === 'object') {
      // Validate stock keys
      for (const [branchKey, stockValue] of Object.entries(stock)) {
        if (!branchKey.endsWith('_stock')) {
          return NextResponse.json(
            {
              error:
                'Stock keys must end with "_stock" (e.g., "ghatpar_stock")',
            },
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
        if (stockValue < 0) {
          return NextResponse.json(
            { error: `Stock for ${branchKey} must be a positive number` },
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
        initialStock[branchKey] = parseInt(stockValue) || 0
      }
    } else {
      // Initialize with default branches
      const branchList =
        branches && Array.isArray(branches) ? branches : DEFAULT_BRANCHES
      branchList.forEach((branch) => {
        initialStock[`${branch}_stock`] = 0
      })
    }

    // Create new product
    const newProduct = {
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      brand: brand?.trim() || '',
      sku: sku?.trim() || null,
      barcode: barcode?.trim() || null,
      category: category?.trim() || '',
      subcategory: subcategory?.trim() || '',
      stock: initialStock,
      status: status || 'active',
      specifications: specifications || {},
      tags: Array.isArray(tags) ? tags.filter((tag) => tag.trim()) : [],
      nicotineStrength: nicotineStrength || null,
      vgPgRatio: vgPgRatio || null,
      flavor: flavor?.trim() || '',
      resistance: resistance || null,
      wattageRange: wattageRange || null,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return handleApiError(err, 'POST /api/products')
  }
}

// PUT: upload product images
export async function PUT(req) {
  logRequest(req, 'PUT')

  try {
    console.log('PUT: Processing image upload...')
    const formData = await req.formData()
    const productId = formData.get('productId')
    const files = formData.getAll('images')

    console.log('PUT: Product ID:', productId, 'Files count:', files.length)

    if (!productId || files.length === 0) {
      console.log('PUT: Missing product ID or files')
      return NextResponse.json(
        { error: 'Product ID and at least one image file are required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { ObjectId } = require('mongodb')
    if (!ObjectId.isValid(productId)) {
      console.log('PUT: Invalid product ID:', productId)
      return NextResponse.json(
        { error: 'Invalid product ID' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

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
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const uploadedImages = []
    const uploadErrors = []

    console.log('PUT: Starting image uploads to Cloudinary...')
    // Upload each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      console.log(
        `PUT: Processing file ${i + 1}/${files.length}, size: ${file.size}`
      )

      // Validate file type
      if (!file.type.startsWith('image/')) {
        uploadErrors.push(`File ${i + 1}: Only image files are allowed`)
        continue
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        uploadErrors.push(`File ${i + 1}: File size must be less than 5MB`)
        continue
      }

      try {
        // Convert file to buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        console.log(`PUT: Uploading file ${i + 1} to Cloudinary...`)
        // Upload to Cloudinary
        const uploadResponse = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                resource_type: 'image',
                folder: 'vwv_vape_products',
                public_id: `vape_product_${productId}_${Date.now()}_${i}`,
                transformation: [
                  { width: 800, height: 800, crop: 'fill' },
                  { quality: 'auto' },
                  { format: 'auto' },
                ],
              },
              (error, result) => {
                if (error) {
                  console.error('Cloudinary upload error:', error)
                  reject(
                    new Error(`Cloudinary upload failed: ${error.message}`)
                  )
                } else {
                  resolve(result)
                }
              }
            )
            .end(buffer)
        })

        uploadedImages.push({
          url: uploadResponse.secure_url,
          publicId: uploadResponse.public_id,
          alt: `${existingProduct.name} - ${existingProduct.category} image ${
            uploadedImages.length + 1
          }`,
        })
        console.log(`PUT: File ${i + 1} uploaded successfully ✓`)
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError)
        uploadErrors.push(`File ${i + 1}: ${uploadError.message}`)
      }
    }

    if (uploadedImages.length === 0) {
      console.log('PUT: No images uploaded successfully')
      return NextResponse.json(
        { error: 'No images were uploaded successfully', errors: uploadErrors },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('PUT: Updating product with new images...')
    // Update product with new images
    const updateResult = await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      {
        $push: { images: { $each: uploadedImages } },
        $set: { updatedAt: new Date() },
      }
    )

    if (updateResult.matchedCount === 0) {
      console.log('PUT: Failed to update product with images')
      // Clean up uploaded images if database update failed
      for (const image of uploadedImages) {
        try {
          await cloudinary.uploader.destroy(image.publicId)
        } catch (cleanupError) {
          console.error('Error cleaning up image:', cleanupError)
        }
      }
      return NextResponse.json(
        { error: 'Failed to update product with images' },
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('PUT: Images uploaded and saved successfully ✓')
    return NextResponse.json(
      {
        message: 'Images uploaded successfully',
        uploadedImages,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return handleApiError(err, 'PUT /api/products')
  }
}

// DELETE: delete product OR remove product images
export async function DELETE(req) {
  logRequest(req, 'DELETE')

  try {
    console.log('DELETE: Processing delete request...')
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const imagePublicId = searchParams.get('imagePublicId')

    console.log(
      'DELETE: Product ID:',
      productId,
      'Image Public ID:',
      imagePublicId
    )

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const { ObjectId } = require('mongodb')
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

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
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Delete specific image
    if (imagePublicId) {
      console.log('DELETE: Deleting specific image:', imagePublicId)
      // Find the image in the product
      const imageToDelete = product.images?.find(
        (img) => img.publicId === imagePublicId
      )
      if (!imageToDelete) {
        return NextResponse.json(
          { error: 'Image not found in product' },
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
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
          $set: { updatedAt: new Date() },
        }
      )

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'Failed to remove image from product' },
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      console.log('DELETE: Image removed from product successfully ✓')
      return NextResponse.json(
        {
          message: 'Image deleted successfully',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
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
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('DELETE: Product deleted successfully ✓')
    return NextResponse.json(
      {
        message: 'Product deleted successfully',
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    return handleApiError(err, 'DELETE /api/products')
  }
}
