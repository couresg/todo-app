import mongoose from "mongoose";

type Cache = { promise: Promise<typeof mongoose> | null };

const globalCache = globalThis as typeof globalThis & { _mongooseCache?: Cache };
const cache: Cache = (globalCache._mongooseCache ??= { promise: null });

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.local.example to .env.local.");
  }
  if (!cache.promise) {
    // MONGODB_DB lets the URI omit the database name (e.g. an Atlas cluster URI)
    cache.promise = mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined }).catch((err) => {
      cache.promise = null;
      throw err;
    });
  }
  return cache.promise;
}
