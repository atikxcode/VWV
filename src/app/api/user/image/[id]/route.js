// src/app/api/user/image/[id]/route.js
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
    if (!user || !user.image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }
    return NextResponse.json({ image: user.image })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
