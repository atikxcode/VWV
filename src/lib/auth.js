import jwt from 'jsonwebtoken'
import { NextResponse } from 'next/server'
import admin from 'firebase-admin'
import clientPromise from './mongodb'

// Initialize Firebase Admin SDK (only initialize once)
if (!admin.apps.length) {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    })
  } catch (error) {
    console.error('Firebase Admin initialization error:', error)
  }
}

// Get user data from database by email
async function getUserFromDatabase(email) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    const user = await db.collection('user').findOne({ email: email.toLowerCase() })
    return user
  } catch (error) {
    console.error('Database lookup error:', error)
    return null
  }
}

// Verify JWT token from request (now supports both Firebase and custom JWT with database role lookup)
export async function verifyApiToken(req) {
  // Get token from Authorization header or cookies
  const authHeader = req.headers.get('authorization')
  let token = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.cookies?.get('auth-token')) {
    token = req.cookies.get('auth-token').value
  }

  if (!token) {
    throw new Error('Authentication required - no token provided')
  }

  try {
    // First, try to verify as Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // Get user data from your database using the email
    const dbUser = await getUserFromDatabase(decodedToken.email)
    
    if (!dbUser) {
      throw new Error('User not found in database')
    }

    // Return combined Firebase + Database user info
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      name: dbUser.name || decodedToken.name || decodedToken.email,
      role: dbUser.role || 'user', // Role from your database
      branch: dbUser.branch || 'main', // Branch from your database
      phone: dbUser.phone || '',
      profilePicture: dbUser.profilePicture || decodedToken.picture || '',
      dbUserId: dbUser._id.toString(), // Database user ID
      provider: 'firebase',
      // Include original Firebase token data
      firebase_claims: decodedToken
    }
  } catch (firebaseError) {
    // If Firebase verification fails, try custom JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // If it's a JWT token, also lookup database user for role
      if (decoded.email) {
        const dbUser = await getUserFromDatabase(decoded.email)
        if (dbUser) {
          return {
            ...decoded,
            role: dbUser.role || decoded.role || 'user',
            branch: dbUser.branch || decoded.branch || 'main',
            name: dbUser.name || decoded.name,
            phone: dbUser.phone || decoded.phone || '',
            profilePicture: dbUser.profilePicture || '',
            dbUserId: dbUser._id.toString(),
            provider: 'jwt'
          }
        }
      }
      
      return {
        ...decoded,
        provider: 'jwt'
      }
    } catch (jwtError) {
      // Log the specific errors for debugging
      console.error('Firebase token verification failed:', firebaseError.message)
      console.error('JWT token verification failed:', jwtError.message)
      
      if (firebaseError.code === 'auth/id-token-expired' || jwtError.name === 'TokenExpiredError') {
        throw new Error('Token expired')
      }
      if (firebaseError.code === 'auth/argument-error' || jwtError.name === 'JsonWebTokenError') {
        throw new Error('Invalid token')
      }
      throw new Error('Authentication failed')
    }
  }
}

// Check if user has required role
export function requireRole(user, allowedRoles = ['admin']) {
  if (!user?.role || !allowedRoles.includes(user.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
  }
  return true
}

// Create standardized auth error response - FIXED FUNCTION NAME
export function createAuthError(message, status = 401) {
  return NextResponse.json(
    {
      error: message,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Simple rate limiting (in-memory - upgrade to Redis for production)
const requestCounts = new Map()
const RATE_LIMIT = 100 // requests per window
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export function checkRateLimit(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             'unknown'
  
  const now = Date.now()
  const windowStart = now - WINDOW_MS
  
  // Clean old entries
  requestCounts.forEach((data, key) => {
    if (data.timestamp < windowStart) {
      requestCounts.delete(key)
    }
  })
  
  const current = requestCounts.get(ip) || { count: 0, timestamp: now }
  
  if (current.timestamp < windowStart) {
    current.count = 1
    current.timestamp = now
  } else {
    current.count++
  }
  
  requestCounts.set(ip, current)
  
  if (current.count > RATE_LIMIT) {
    throw new Error('Too many requests - rate limit exceeded')
  }
}

// Helper function to update user role in database
export async function updateUserRole(email, role, branch = null) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    
    const updateData = {
      role,
      updatedAt: new Date()
    }
    
    if (branch !== null) {
      updateData.branch = branch
    }
    
    const result = await db.collection('user').updateOne(
      { email: email.toLowerCase() },
      { $set: updateData }
    )
    
    return result.matchedCount > 0
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

// Helper function to ensure user exists in database (for first-time Firebase users)
export async function ensureUserInDatabase(firebaseUser) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    
    const existingUser = await db.collection('user').findOne({ 
      email: firebaseUser.email.toLowerCase() 
    })
    
    if (!existingUser) {
      // Create new user with default role
      const newUser = {
        email: firebaseUser.email.toLowerCase(),
        name: firebaseUser.displayName || firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        role: 'user', // Default role
        branch: 'main', // Default branch
        profilePicture: firebaseUser.photoURL || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        firebaseUid: firebaseUser.uid
      }
      
      const result = await db.collection('user').insertOne(newUser)
      return { ...newUser, _id: result.insertedId }
    }
    
    return existingUser
  } catch (error) {
    console.error('Error ensuring user in database:', error)
    return null
  }
}