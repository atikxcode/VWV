// src/app/api/requisitions/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'
import { verifyApiToken, requireRole, createAuthError, checkRateLimit } from '@/lib/auth'
import { ObjectId } from 'mongodb'

// Security constants
const MAX_ITEMS_PER_REQUISITION = 50
const MAX_REQUEST_BODY_SIZE = 100000 // 100KB

// Rate limiting
const RATE_LIMITS = {
  PUBLIC: { requests: 50, windowMs: 60000 },
  ADMIN: { requests: 200, windowMs: 60000 },
  POS: { requests: 100, windowMs: 60000 },
}

// Error handler
function handleApiError(error, context = '') {
  console.error(`🚨 API Error in ${context}:`, error)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return NextResponse.json(
    {
      error: isDevelopment ? error.message : 'Internal server error',
      context: isDevelopment ? context : undefined,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

// Generate requisition number
function generateRequisitionNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `REQ-${year}${month}-${random}`
}

// GET: Fetch requisitions
export async function GET(req) {
  try {
    const user = await verifyApiToken(req)
    
    // Apply rate limiting
    const rateLimit = RATE_LIMITS[user.role?.toUpperCase()] || RATE_LIMITS.PUBLIC
    try {
      checkRateLimit(req, rateLimit)
    } catch (rateLimitError) {
      console.warn('Rate limit check failed:', rateLimitError.message)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const branch = searchParams.get('branch')
    const limit = parseInt(searchParams.get('limit') || '50')

    const client = await clientPromise
    const db = client.db('VWV')

    // Build query based on user role
    let query = {}
    
    if (user.role === 'pos') {
      // POS users only see requisitions for their branch
      query.destinationBranch = user.branch
    } else if (branch && user.role === 'admin') {
      // Admin can filter by branch
      query.destinationBranch = branch
    }

    if (status) {
      query.status = status
    }

    const requisitions = await db
      .collection('requisitions')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json(
      { 
        requisitions,
        total: requisitions.length 
      },
      { status: 200 }
    )

  } catch (error) {
    return handleApiError(error, 'GET /api/requisitions')
  }
}

// POST: Create new requisition
export async function POST(req) {
  try {
    const user = await verifyApiToken(req)
    
    // Only POS and Admin can create requisitions
    if (!['pos', 'admin'].includes(user.role)) {
      return createAuthError('Only POS users and admins can create requisitions', 403)
    }

    const body = await req.json()
    
    // Validate body size
    const bodySize = JSON.stringify(body).length
    if (bodySize > MAX_REQUEST_BODY_SIZE) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 })
    }

    const { items, sourceBranch, notes, priority } = body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (items.length > MAX_ITEMS_PER_REQUISITION) {
      return NextResponse.json({ 
        error: `Maximum ${MAX_ITEMS_PER_REQUISITION} items per requisition` 
      }, { status: 400 })
    }

    if (!sourceBranch) {
      return NextResponse.json({ error: 'Source branch is required' }, { status: 400 })
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.productName || !item.requestedQty) {
        return NextResponse.json({ 
          error: 'Each item must have productId, productName, and requestedQty' 
        }, { status: 400 })
      }

      if (item.requestedQty <= 0 || item.requestedQty > 10000) {
        return NextResponse.json({ 
          error: 'Quantity must be between 1 and 10000' 
        }, { status: 400 })
      }
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Create requisition document
    const newRequisition = {
      requisitionNumber: generateRequisitionNumber(),
      requestedBy: {
        userId: user.userId,
        name: user.name || user.email,
        email: user.email,
        branch: user.branch || 'N/A'
      },
      items: items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        requestedQty: parseInt(item.requestedQty),
        approvedQty: null,
        options: item.options || null,
        image: item.image || null
      })),
      sourceBranch: sourceBranch.toLowerCase(),
      destinationBranch: user.branch ? user.branch.toLowerCase() : 'unknown',
      status: 'pending',
      priority: priority || 'normal',
      notes: notes || '',
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      deliveryDate: null,
      receivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('requisitions').insertOne(newRequisition)

    // Create audit log
    try {
      await db.collection('audit_logs').insertOne({
        action: 'REQUISITION_CREATED',
        userId: user.userId,
        userEmail: user.email,
        requisitionId: result.insertedId.toString(),
        requisitionNumber: newRequisition.requisitionNumber,
        itemCount: items.length,
        timestamp: new Date()
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({
      message: 'Requisition created successfully',
      requisition: { ...newRequisition, _id: result.insertedId }
    }, { status: 201 })

  } catch (error) {
    return handleApiError(error, 'POST /api/requisitions')
  }
}

// PATCH: Update requisition status (approve/reject)
export async function PATCH(req) {
  try {
    const user = await verifyApiToken(req)
    
    // Only admin can update requisitions
    requireRole(user, ['admin'])

    const body = await req.json()
    const { requisitionId, action, approvedQuantities, deliveryDate, rejectionReason } = body

    if (!requisitionId || !action) {
      return NextResponse.json({ 
        error: 'requisitionId and action are required' 
      }, { status: 400 })
    }

    if (!['approve', 'reject', 'mark-in-transit', 'mark-received'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be: approve, reject, mark-in-transit, or mark-received' 
      }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Get requisition
    const requisition = await db.collection('requisitions').findOne({ 
      _id: new ObjectId(requisitionId) 
    })

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    }

    let updateData = { updatedAt: new Date() }

    if (action === 'approve') {
      if (requisition.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Only pending requisitions can be approved' 
        }, { status: 400 })
      }

      // Update approved quantities
      if (approvedQuantities) {
        updateData['items'] = requisition.items.map((item, idx) => ({
          ...item,
          approvedQty: approvedQuantities[idx] !== undefined 
            ? parseInt(approvedQuantities[idx]) 
            : item.requestedQty
        }))
      }

      updateData.status = 'approved'
      updateData.approvedBy = user.email
      updateData.approvedAt = new Date()
      if (deliveryDate) {
        updateData.deliveryDate = new Date(deliveryDate)
      }

    } else if (action === 'reject') {
      if (requisition.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Only pending requisitions can be rejected' 
        }, { status: 400 })
      }

      updateData.status = 'rejected'
      updateData.rejectedBy = user.email
      updateData.rejectedAt = new Date()
      updateData.rejectionReason = rejectionReason || 'No reason provided'

    } else if (action === 'mark-in-transit') {
      if (requisition.status !== 'approved') {
        return NextResponse.json({ 
          error: 'Only approved requisitions can be marked as in-transit' 
        }, { status: 400 })
      }

      updateData.status = 'in-transit'

    } else if (action === 'mark-received') {
      if (requisition.status !== 'in-transit') {
        return NextResponse.json({ 
          error: 'Only in-transit requisitions can be marked as received' 
        }, { status: 400 })
      }

      updateData.status = 'received'
      updateData.receivedAt = new Date()

      // ==========================================
      // 🚀 NEW: STOCK TRANSFER LOGIC
      // ==========================================
      console.log('🔄 Starting stock transfer process...')
      
      const sourceBranch = requisition.sourceBranch.toLowerCase()
      const destinationBranch = requisition.destinationBranch.toLowerCase()
      const sourceStockKey = `${sourceBranch}_stock`
      const destStockKey = `${destinationBranch}_stock`

      console.log(`📦 Transfer: ${sourceBranch} → ${destinationBranch}`)

      // Get items with approved quantities
      const itemsToTransfer = requisition.items.filter(item => 
        item.approvedQty !== null && item.approvedQty > 0
      )

      if (itemsToTransfer.length === 0) {
        return NextResponse.json({ 
          error: 'No items with approved quantities to transfer' 
        }, { status: 400 })
      }

      // Track transfer results
      const transferResults = []
      const transferErrors = []

      // Process each product
      for (const item of itemsToTransfer) {
        try {
          console.log(`\n📦 Processing: ${item.productName} (${item.approvedQty} units)`)
          
          // Get current product from database
          const product = await db.collection('products').findOne({ 
            _id: new ObjectId(item.productId) 
          })

          if (!product) {
            console.error(`❌ Product not found: ${item.productId}`)
            transferErrors.push({
              productId: item.productId,
              productName: item.productName,
              error: 'Product not found'
            })
            continue
          }

          // Get current stock quantities
          const currentSourceStock = product.stock?.[sourceStockKey] || 0
          const currentDestStock = product.stock?.[destStockKey] || 0

          console.log(`📊 Current stock - Source: ${currentSourceStock}, Dest: ${currentDestStock}`)

          // Validate source has enough stock
          if (currentSourceStock < item.approvedQty) {
            console.error(`❌ Insufficient stock at source: ${currentSourceStock} < ${item.approvedQty}`)
            transferErrors.push({
              productId: item.productId,
              productName: item.productName,
              error: `Insufficient stock at ${sourceBranch}. Available: ${currentSourceStock}, Required: ${item.approvedQty}`
            })
            continue
          }

          // Calculate new stock quantities
          const newSourceStock = currentSourceStock - item.approvedQty
          const newDestStock = currentDestStock + item.approvedQty

          console.log(`🔄 New stock - Source: ${newSourceStock}, Dest: ${newDestStock}`)

          // Update product stock in database
          const stockUpdate = {
            [`stock.${sourceStockKey}`]: newSourceStock,
            [`stock.${destStockKey}`]: newDestStock,
            updatedAt: new Date(),
            updatedBy: user.email
          }

          const updateResult = await db.collection('products').updateOne(
            { _id: new ObjectId(item.productId) },
            { $set: stockUpdate }
          )

          if (updateResult.matchedCount === 0) {
            console.error(`❌ Failed to update stock for product: ${item.productId}`)
            transferErrors.push({
              productId: item.productId,
              productName: item.productName,
              error: 'Failed to update stock'
            })
            continue
          }

          console.log(`✅ Stock updated successfully`)
          
          transferResults.push({
            productId: item.productId,
            productName: item.productName,
            transferredQty: item.approvedQty,
            sourceStock: {
              before: currentSourceStock,
              after: newSourceStock
            },
            destinationStock: {
              before: currentDestStock,
              after: newDestStock
            }
          })

          // Create stock movement audit log
          try {
            await db.collection('audit_logs').insertOne({
              action: 'STOCK_TRANSFER',
              userId: user.userId,
              userEmail: user.email,
              requisitionId: requisitionId,
              requisitionNumber: requisition.requisitionNumber,
              productId: item.productId,
              productName: item.productName,
              quantity: item.approvedQty,
              sourceBranch: sourceBranch,
              destinationBranch: destinationBranch,
              sourceStockBefore: currentSourceStock,
              sourceStockAfter: newSourceStock,
              destStockBefore: currentDestStock,
              destStockAfter: newDestStock,
              timestamp: new Date()
            })
          } catch (auditError) {
            console.error('Audit log error:', auditError)
          }

        } catch (itemError) {
          console.error(`❌ Error processing item ${item.productId}:`, itemError)
          transferErrors.push({
            productId: item.productId,
            productName: item.productName,
            error: itemError.message
          })
        }
      }

      console.log(`\n📊 Transfer Summary:`)
      console.log(`   ✅ Successful: ${transferResults.length}`)
      console.log(`   ❌ Failed: ${transferErrors.length}`)

      // Add transfer results to update data
      updateData.stockTransfer = {
        successful: transferResults,
        failed: transferErrors,
        completedAt: new Date()
      }

      // If all transfers failed, return error
      if (transferResults.length === 0 && transferErrors.length > 0) {
        return NextResponse.json({ 
          error: 'Stock transfer failed for all items',
          details: transferErrors
        }, { status: 500 })
      }
      // ==========================================
      // END OF STOCK TRANSFER LOGIC
      // ==========================================
    }

    const result = await db.collection('requisitions').updateOne(
      { _id: new ObjectId(requisitionId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Failed to update requisition' }, { status: 500 })
    }

    // Create audit log
    try {
      await db.collection('audit_logs').insertOne({
        action: `REQUISITION_${action.toUpperCase().replace('-', '_')}`,
        userId: user.userId,
        userEmail: user.email,
        requisitionId: requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        timestamp: new Date()
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    // Build response message
    let responseMessage = `Requisition ${action}d successfully`
    if (action === 'mark-received' && updateData.stockTransfer) {
      const { successful, failed } = updateData.stockTransfer
      responseMessage += `. Stock transferred: ${successful.length} successful, ${failed.length} failed.`
    }

    return NextResponse.json({
      message: responseMessage,
      requisition: { ...requisition, ...updateData },
      stockTransfer: updateData.stockTransfer || null
    }, { status: 200 })

  } catch (error) {
    return handleApiError(error, 'PATCH /api/requisitions')
  }
}

// DELETE: Delete requisition (admin only, only pending requisitions)
export async function DELETE(req) {
  try {
    const user = await verifyApiToken(req)
    requireRole(user, ['admin'])

    const { searchParams } = new URL(req.url)
    const requisitionId = searchParams.get('id')

    if (!requisitionId) {
      return NextResponse.json({ error: 'Requisition ID is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('VWV')

    const requisition = await db.collection('requisitions').findOne({ 
      _id: new ObjectId(requisitionId) 
    })

    if (!requisition) {
      return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
    }

    if (requisition.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending requisitions can be deleted' 
      }, { status: 400 })
    }

    await db.collection('requisitions').deleteOne({ _id: new ObjectId(requisitionId) })

    // Create audit log
    try {
      await db.collection('audit_logs').insertOne({
        action: 'REQUISITION_DELETED',
        userId: user.userId,
        userEmail: user.email,
        requisitionId: requisitionId,
        requisitionNumber: requisition.requisitionNumber,
        timestamp: new Date()
      })
    } catch (auditError) {
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({ 
      message: 'Requisition deleted successfully' 
    }, { status: 200 })

  } catch (error) {
    return handleApiError(error, 'DELETE /api/requisitions')
  }
}
