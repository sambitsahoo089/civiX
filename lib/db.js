import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:5434/?directConnection=true";
const MONGODB_DB = process.env.MONGODB_DB || "civix";

const globalForMongoose = globalThis;

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const cached = globalForMongoose.mongoose;
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    // Fail fast instead of hanging for the 30s default, and drop the cached
    // promise when it rejects — otherwise a database outage (or a restart of the
    // local mongod) would poison every later request until the server restarts.
    cached.promise = mongoose
      .connect(MONGODB_URI, { dbName: MONGODB_DB, serverSelectionTimeoutMS: 5000 })
      .then((instance) => {
        cached.conn = instance;
        return instance;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        throw err;
      });
  }

  return cached.promise;
}

export { mongoose };