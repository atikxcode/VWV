// src/app/api/user/[id]/route.js
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    const user = await db
      .collection('user')
      .findOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    const body = await req.json()
    const updateDoc = { $set: body }
    const result = await db
      .collection('user')
      .updateOne({ _id: new ObjectId(params.id) }, updateDoc)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const client = await clientPromise
    const db = client.db('VWV')
    const result = await db
      .collection('user')
      .deleteOne({ _id: new ObjectId(params.id) })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
