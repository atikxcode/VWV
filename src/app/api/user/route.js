// src/app/api/user/route.js
import clientPromise from '@/lib/mongodb'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    const users = await db.collection('user').find().toArray()
    return NextResponse.json(users)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const client = await clientPromise
    const db = client.db('VWV')
    const result = await db.collection('user').insertOne(body)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
