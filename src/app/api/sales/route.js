// src/app/api/sales/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb' // ✅ Add this import
import { NextResponse } from 'next/server'

export async function POST(req) {
  const client = await clientPromise
  const db = client.db('VWV')

  // Start a transaction for data consistency
  const session = client.startSession()

  try {
    const body = await req.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    let result
    await session.withTransaction(async () => {
      // Create sale record
      const saleData = {
        ...body,
        createdAt: new Date(),
        saleId: `SALE-${Date.now()}`,
      }

      // Insert sale
      result = await db.collection('sales').insertOne(saleData, { session })

      // Update product stock for each item
      for (const item of body.items) {
        if (!item.productId || !item.branch || !item.quantity) {
          throw new Error(
            'Invalid item data: missing productId, branch, or quantity'
          )
        }

        // Check if product exists and has enough stock
        const product = await db
          .collection('products')
          .findOne({ _id: new ObjectId(item.productId) }, { session })

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`)
        }

        const currentStock = product.stock?.[`${item.branch}_stock`] || 0
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name} at ${item.branch} branch. Available: ${currentStock}, Requested: ${item.quantity}`
          )
        }

        // Update stock
        const updateResult = await db.collection('products').updateOne(
          { _id: new ObjectId(item.productId) },
          {
            $inc: { [`stock.${item.branch}_stock`]: -item.quantity },
            $set: { updatedAt: new Date() },
          },
          { session }
        )

        if (updateResult.matchedCount === 0) {
          throw new Error(
            `Failed to update stock for product: ${item.productId}`
          )
        }
      }

      return saleData
    })

    return NextResponse.json({
      success: true,
      message: 'Sale processed successfully',
      saleId: `SALE-${Date.now()}`,
      sale: result,
    })
  } catch (error) {
    console.error('Error processing sale:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process sale',
        details: error.stack,
      },
      { status: 500 }
    )
  } finally {
    await session.endSession()
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100) // Cap at 100
    const page = Math.max(parseInt(searchParams.get('page')) || 1, 1) // Min 1
    const skip = (page - 1) * limit

    // Optional filters
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const paymentType = searchParams.get('paymentType')
    const status = searchParams.get('status')

    const client = await clientPromise
    const db = client.db('VWV')

    // Build query filter
    let filter = {}

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      }
    }

    if (paymentType) {
      filter.paymentType = paymentType
    }

    if (status) {
      filter.status = status
    }

    // Get total count for pagination
    const totalCount = await db.collection('sales').countDocuments(filter)
    const totalPages = Math.ceil(totalCount / limit)

    // Fetch sales
    const sales = await db
      .collection('sales')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      sales,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    )
  }
}
