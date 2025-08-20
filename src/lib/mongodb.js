import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local')
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In dev, use a global variable so the client is reused on hot reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, { tls: true })
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production, always create a new client
  client = new MongoClient(uri, { tls: true })
  clientPromise = client.connect()
}

export default clientPromise
