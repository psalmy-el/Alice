// Fixed database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Alice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Function to test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Export both the pool and the testConnection function
module.exports = {
  pool,
  testConnection,
  execute: (...args) => pool.execute(...args)
};