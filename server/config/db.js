// ── FILE: config/db.js ── Mongoose connection manager
const mongoose = require('mongoose');

/**
 * Connect to MongoDB with retry logic.
 * Falls back gracefully so the server can still start in demo mode.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.log('⚠️  MONGODB_URI not set — skipping database connection.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000, // Fail fast if cluster unreachable
    });
    console.log('✅ MongoDB connected successfully.');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('💡 Common causes:');
    console.log('   1. IP not whitelisted in MongoDB Atlas');
    console.log('   2. Incorrect connection string or password');
    return false;
  }
};

module.exports = connectDB;
