// src/app/api/user/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

// GET: return all users OR check by email if provided
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    const client = await clientPromise
    const db = client.db('VWV')

    if (email) {
      const user = await db.collection('user').findOne({ email })
      return NextResponse.json({ exists: !!user, user })
    }

    // return all users if no email provided
    const users = await db.collection('user').find().toArray()
    return NextResponse.json(users)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: insert user only if not exists
export async function POST(req) {
  try {
    const body = await req.json()
    const client = await clientPromise
    const db = client.db('VWV')

    // check if user already exists
    const existingUser = await db
      .collection('user')
      .findOne({ email: body.email })
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: existingUser },
        { status: 200 }
      )
    }

    // insert new user
    const result = await db.collection('user').insertOne(body)
    return NextResponse.json(
      { message: 'User created', result },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
