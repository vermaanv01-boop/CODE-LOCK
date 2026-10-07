import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/codelock';

function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(/(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1****$3');
  } catch {
    return 'mongodb://[protected]';
  }
}

export async function connectDB(): Promise<boolean> {
  const safeUri = sanitizeMongoUri(MONGODB_URI);
  try {
    mongoose.set('strictQuery', false);
    // Timeout quickly if local MongoDB daemon is not running so we can inform or fallback
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    console.log(`[DB] Connected to MongoDB at ${safeUri}`);
    return true;
  } catch (err: any) {
    console.warn(`[DB] Could not connect to MongoDB at ${safeUri}: ${err.message}`);
    console.warn(`[DB] Running in offline resilient database fallback mode.`);
    return false;
  }
}

