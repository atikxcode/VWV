import clientPromise from '../../../lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('vwv')

    // Ping DB
    await db.command({ ping: 1 })
    console.log('MongoDB ping successful')

    return new Response(JSON.stringify({ message: 'Connected!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('MongoDB connection error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
