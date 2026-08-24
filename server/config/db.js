/**
 * server/config/db.js
 *
 * MySQL connection pool configured with the existing environment variables.
 * The application uses mysql2 with parameterized queries and does not rely on
 * any Mongoose runtime behavior.
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'skillsync',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
});

const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
  } catch (err) {
    console.error(`❌ MySQL connection failed: ${err.message}`);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
