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

// GET: return all products OR get product by ID/search
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit')) || 0
    const page = parseInt(searchParams.get('page')) || 1

    const client = await clientPromise
    const db = client.db('VWV')

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

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ]
    }

    if (status) {
      query.status = status
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

// POST: create new product OR update existing product
export async function POST(req) {
  try {
    const body = await req.json()
    const { action } = body

    const client = await clientPromise
    const db = client.db('VWV')

    // Handle product update
    if (action === 'update') {
      const {
        id,
        name,
        description,
        price,
        comparePrice,
        category,
        brand,
        sku,
        stock,
        status,
        specifications,
        tags,
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

      if (stock < 0) {
        return NextResponse.json(
          { error: 'Stock must be a positive number' },
          { status: 400 }
        )
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

      // Check for duplicate SKU (if provided and different from current)
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

      // Update product
      const updateResult = await db.collection('products').updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: name.trim(),
            description: description?.trim() || '',
            price: parseFloat(price),
            comparePrice: comparePrice ? parseFloat(comparePrice) : null,
            category: category.trim(),
            brand: brand?.trim() || '',
            sku: sku?.trim() || null,
            stock: parseInt(stock) || 0,
            status: status || 'active',
            specifications: specifications || {},
            tags: Array.isArray(tags) ? tags : [],
            updatedAt: new Date(),
          },
        }
      )

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
      category,
      brand,
      sku,
      stock,
      status,
      specifications,
      tags,
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

    if (stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a positive number' },
        { status: 400 }
      )
    }

    // Check for duplicate SKU if provided
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

    // Create new product
    const newProduct = {
      name: name.trim(),
      description: description?.trim() || '',
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      category: category.trim(),
      brand: brand?.trim() || '',
      sku: sku?.trim() || null,
      stock: parseInt(stock) || 0,
      status: status || 'active',
      specifications: specifications || {},
      tags: Array.isArray(tags) ? tags : [],
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
                folder: 'vwv_products',
                public_id: `product_${productId}_${Date.now()}_${i}`,
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
          alt: `${existingProduct.name} image ${i + 1}`,
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
