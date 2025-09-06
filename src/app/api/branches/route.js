// src/app/api/branches/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'


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
  console.log(`${method} /api/branches called at ${new Date().toISOString()}`)
  console.log('URL:', req.url)
}

// Default branches to match your database structure
const DEFAULT_BRANCHES = ['ghatpar', 'mirpur', 'gazipur']

// GET: Get all branches
export async function GET(req) {
  logRequest(req, 'GET')

  try {
    console.log('GET: Fetching branches from database...')
    const client = await clientPromise
    const db = client.db('VWV')

    // Try to get branches from settings collection
    const branchDoc = await db
      .collection('settings')
      .findOne({ type: 'branches' })

    if (branchDoc && branchDoc.branches && Array.isArray(branchDoc.branches)) {
      console.log('GET: Branches found in database:', branchDoc.branches)
      return NextResponse.json(
        { branches: branchDoc.branches },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // If no branches in DB, create default ones
    console.log('GET: No branches found, creating defaults...')
    const newBranchDoc = {
      type: 'branches',
      branches: DEFAULT_BRANCHES,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection('settings').insertOne(newBranchDoc)
    console.log('GET: Default branches created successfully ✓')

    return NextResponse.json(
      { branches: DEFAULT_BRANCHES },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return handleApiError(error, 'GET /api/branches')
  }
}

// POST: Add new branch
export async function POST(req) {
  logRequest(req, 'POST')

  try {
    console.log('POST: Adding new branch...')
    const body = await req.json()
    const { action, branchName } = body

    console.log('POST: Request body:', { action, branchName })

    if (action !== 'add' || !branchName) {
      console.log('POST: Invalid request - missing action or branchName')
      return NextResponse.json(
        {
          error:
            'Invalid request. Action must be "add" and branchName is required.',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate branch name
    const cleanBranchName = branchName.trim().toLowerCase()
    if (!cleanBranchName) {
      return NextResponse.json(
        { error: 'Branch name cannot be empty' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const client = await clientPromise
    const db = client.db('VWV')

    // Check if branch already exists
    const existingDoc = await db
      .collection('settings')
      .findOne({ type: 'branches' })
    if (
      existingDoc &&
      existingDoc.branches &&
      existingDoc.branches.includes(cleanBranchName)
    ) {
      console.log('POST: Branch already exists:', cleanBranchName)
      return NextResponse.json(
        { error: 'Branch already exists' },
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Add branch to array (creates document if it doesn't exist)
    const updateResult = await db.collection('settings').updateOne(
      { type: 'branches' },
      {
        $addToSet: { branches: cleanBranchName },
        $set: { updatedAt: new Date() },
        $setOnInsert: {
          createdAt: new Date(),
          type: 'branches',
        },
      },
      { upsert: true }
    )

    console.log('POST: Branch added successfully ✓')
    console.log('POST: Update result:', updateResult)

    return NextResponse.json(
      {
        message: 'Branch added successfully',
        branchName: cleanBranchName,
      },
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return handleApiError(error, 'POST /api/branches')
  }
}

// DELETE: Remove branch
export async function DELETE(req) {
  logRequest(req, 'DELETE')

  try {
    console.log('DELETE: Removing branch...')
    const body = await req.json()
    const { branchName } = body

    console.log('DELETE: Request body:', { branchName })

    if (!branchName) {
      console.log('DELETE: Branch name missing')
      return NextResponse.json(
        { error: 'Branch name is required' },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const cleanBranchName = branchName.trim().toLowerCase()

    const client = await clientPromise
    const db = client.db('VWV')

    // Check if this is the last branch (prevent deletion)
    const currentDoc = await db
      .collection('settings')
      .findOne({ type: 'branches' })
    if (currentDoc && currentDoc.branches && currentDoc.branches.length <= 1) {
      console.log('DELETE: Cannot delete last branch')
      return NextResponse.json(
        {
          error:
            'Cannot delete the last branch. At least one branch must exist.',
        },
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Remove branch from array
    const updateResult = await db.collection('settings').updateOne(
      { type: 'branches' },
      {
        $pull: { branches: cleanBranchName },
        $set: { updatedAt: new Date() },
      }
    )

    if (updateResult.matchedCount === 0) {
      console.log('DELETE: Branch settings not found')
      return NextResponse.json(
        { error: 'Branch settings not found' },
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    console.log('DELETE: Branch removed successfully ✓')
    console.log('DELETE: Update result:', updateResult)

    return NextResponse.json(
      {
        message: 'Branch deleted successfully',
        branchName: cleanBranchName,
      },
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return handleApiError(error, 'DELETE /api/branches')
  }
}
