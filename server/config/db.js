/**
 * server/config/db.js
 *
 * Handles connecting to MongoDB via Mongoose.
 *
 * Mongoose is the "Object Document Mapper" (ODM) for MongoDB.
 * Think of it as a translator:
 *   - You write clean JavaScript (User.findById(id))
 *   - Mongoose translates it to MongoDB queries under the hood
 *
 * Why a separate file?
 * Keeps database logic isolated. If you ever switch from MongoDB
 * to PostgreSQL, you change this one file, nothing else.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // ── Connection lifecycle events ──────────────────────────────
    // These fire automatically when the connection state changes.
    // Useful for debugging dropped connections in production.

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);

    // Exit with code 1 (failure).
    // There is no point keeping the server alive without a database.
    // The process manager (nodemon / PM2 / Docker) will restart it.
    process.exit(1);
  }
};

module.exports = connectDB;
