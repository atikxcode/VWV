// src/app/api/products/route.js
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
  try {
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
    const getCategoriesOnly = searchParams.get('getCategoriesOnly') // For category management

    const client = await clientPromise
    const db = client.db('VWV')

    // Get categories structure for frontend
    if (getCategoriesOnly === 'true') {
      // Get dynamic categories from database (custom ones added by admin)
      const customCategories = await db
        .collection('categories')
        .find()
        .toArray()
      const allCategories = { ...VAPE_CATEGORIES }

      customCategories.forEach((cat) => {
        allCategories[cat.name] = cat.subcategories
      })

      return NextResponse.json({ categories: allCategories })
    }

    // Get product by barcode (for barcode scanner)
    if (barcode) {
      const product = await db
        .collection('products')
        .findOne({ barcode: barcode })
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found with this barcode' },
          { status: 404 }
        )
      }
      return NextResponse.json(product)
    }

    // Get single product by ID
    if (id) {
      const { ObjectId } = require('mongodb')
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        )
      }
      const product = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(product)
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

    // Get total count for pagination
    const totalProducts = await db.collection('products').countDocuments(query)

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

    return NextResponse.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: limit > 0 ? Math.ceil(totalProducts / limit) : 1,
        totalProducts,
        hasNextPage: limit > 0 && skip + products.length < totalProducts,
        hasPrevPage: page > 1,
      },
    })
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: create new product, update product, or manage categories
export async function POST(req) {
  try {
    const body = await req.json()
    const { action } = body

    const client = await clientPromise
    const db = client.db('VWV')

    // Handle category management
    if (action === 'add_category') {
      const { categoryName, subcategories } = body

      if (!categoryName) {
        return NextResponse.json(
          { error: 'Category name is required' },
          { status: 400 }
        )
      }

      // Check if category already exists
      const existingCategory = await db.collection('categories').findOne({
        name: categoryName.toUpperCase(),
      })

      if (existingCategory) {
        return NextResponse.json(
          { error: 'Category already exists' },
          { status: 400 }
        )
      }

      const newCategory = {
        name: categoryName.toUpperCase(),
        subcategories: Array.isArray(subcategories) ? subcategories : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.collection('categories').insertOne(newCategory)

      return NextResponse.json({
        message: 'Category added successfully',
        category: newCategory,
      })
    }

    // Handle subcategory management
    if (action === 'add_subcategory') {
      const { categoryName, subcategoryName } = body

      if (!categoryName || !subcategoryName) {
        return NextResponse.json(
          {
            error: 'Category name and subcategory name are required',
          },
          { status: 400 }
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
          // Create custom category with existing subcategories + new one
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
          return NextResponse.json(
            { error: 'Category not found' },
            { status: 404 }
          )
        }
      }

      return NextResponse.json({ message: 'Subcategory added successfully' })
    }

    // Handle product update
    if (action === 'update') {
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
        nicotineStrength, // For vape products
        vgPgRatio, // For e-liquids
        flavor, // For e-liquids
        resistance, // For coils/tanks
        wattageRange, // For devices
      } = body

      if (!id) {
        return NextResponse.json(
          { error: 'Product ID is required for update' },
          { status: 400 }
        )
      }

      // Validation
      if (!name || !price || !category) {
        return NextResponse.json(
          { error: 'Name, price, and category are required' },
          { status: 400 }
        )
      }

      if (price < 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number' },
          { status: 400 }
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
              { status: 400 }
            )
          }
          if (stockValue < 0) {
            return NextResponse.json(
              { error: `Stock for ${branchKey} must be a positive number` },
              { status: 400 }
            )
          }
        }
      }

      const { ObjectId } = require('mongodb')
      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        )
      }

      // Check if product exists
      const existingProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })
      if (!existingProduct) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
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
            { status: 400 }
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
            { status: 400 }
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
        // Vape-specific fields
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
          { status: 500 }
        )
      }

      // Get updated product
      const updatedProduct = await db
        .collection('products')
        .findOne({ _id: new ObjectId(id) })

      return NextResponse.json(
        {
          message: 'Product updated successfully',
          product: updatedProduct,
        },
        { status: 200 }
      )
    }

    // Handle product creation (default behavior)
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
      // Vape-specific fields
      nicotineStrength,
      vgPgRatio,
      flavor,
      resistance,
      wattageRange,
    } = body

    // Validation for new product
    if (!name || !price || !category) {
      return NextResponse.json(
        { error: 'Name, price, and category are required' },
        { status: 400 }
      )
    }

    if (price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      )
    }

    // Check for duplicate SKU or barcode if provided
    if (sku) {
      const existingSku = await db
        .collection('products')
        .findOne({ sku: sku.trim() })
      if (existingSku) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    if (barcode) {
      const existingBarcode = await db
        .collection('products')
        .findOne({ barcode: barcode.trim() })
      if (existingBarcode) {
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
        if (!branchKey.endsWith('_stock')) {
          return NextResponse.json(
            {
              error:
                'Stock keys must end with "_stock" (e.g., "ghatpar_stock")',
            },
            { status: 400 }
          )
        }
        if (stockValue < 0) {
          return NextResponse.json(
            { error: `Stock for ${branchKey} must be a positive number` },
            { status: 400 }
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
      // Vape-specific fields
      nicotineStrength: nicotineStrength || null,
      vgPgRatio: vgPgRatio || null,
      flavor: flavor?.trim() || '',
      resistance: resistance || null,
      wattageRange: wattageRange || null,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await db.collection('products').insertOne(newProduct)

    // Get the created product with its ID
    const createdProduct = await db
      .collection('products')
      .findOne({ _id: result.insertedId })

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: createdProduct,
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT: upload product images
export async function PUT(req) {
  try {
    const formData = await req.formData()
    const productId = formData.get('productId')
    const files = formData.getAll('images')

    if (!productId || files.length === 0) {
      return NextResponse.json(
        { error: 'Product ID and at least one image file are required' },
        { status: 400 }
      )
    }

    const { ObjectId } = require('mongodb')
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Check if product exists
    const existingProduct = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) })
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const uploadedImages = []
    const uploadErrors = []

    // Upload each image
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

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
      } catch (uploadError) {
        console.error('Error uploading file:', uploadError)
        uploadErrors.push(`File ${i + 1}: ${uploadError.message}`)
      }
    }

    if (uploadedImages.length === 0) {
      return NextResponse.json(
        { error: 'No images were uploaded successfully', errors: uploadErrors },
        { status: 400 }
      )
    }

    // Update product with new images
    const updateResult = await db.collection('products').updateOne(
      { _id: new ObjectId(productId) },
      {
        $push: { images: { $each: uploadedImages } },
        $set: { updatedAt: new Date() },
      }
    )

    if (updateResult.matchedCount === 0) {
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
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Images uploaded successfully',
        uploadedImages,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Error uploading product images:', err)
    return NextResponse.json(
      {
        error: 'Failed to upload images',
        details: err.message,
      },
      { status: 500 }
    )
  }
}

// DELETE: delete product OR remove product images
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const imagePublicId = searchParams.get('imagePublicId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { ObjectId } = require('mongodb')
    if (!ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Get product
    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(productId) })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Delete specific image
    if (imagePublicId) {
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
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Image deleted successfully',
      })
    }

    // Delete entire product
    // First, delete all product images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const image of product.images) {
        try {
          await cloudinary.uploader.destroy(image.publicId)
        } catch (deleteError) {
          console.error('Error deleting product image:', deleteError)
        }
      }
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

    return NextResponse.json({
      message: 'Product deleted successfully',
    })
  } catch (err) {
    console.error('Error deleting product:', err)
    return NextResponse.json(
      {
        error: 'Failed to delete product',
        details: err.message,
      },
      { status: 500 }
    )
  }
}
