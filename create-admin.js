// create-admin.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./config/database');

async function createAdmin() {
  console.log('Attempting to connect to the database...');

  try {
    // Admin details - customize these!
    const adminDetails = {
      username: 'Alice',
      email: 'abedusamuel@gmail.com',
      password: 'Alice123@' 
    };

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminDetails.password, saltRounds);

    // Check if admin already exists
    const [existingAdmin] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [adminDetails.username, adminDetails.email]
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists!');
    } else {
      // Insert admin into database
      await db.execute(
        'INSERT INTO admins (username, email, password) VALUES (?, ?, ?)',
        [adminDetails.username, adminDetails.email, hashedPassword]
      );
      console.log('Admin user created successfully!');
    }
    
    // Check if last_login column exists
    const [columns] = await db.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'admins' 
      AND COLUMN_NAME = 'last_login'
    `);
    
    // Add last_login column if it doesn't exist
    if (columns.length === 0) {
      console.log('Adding last_login column to admins table...');
      await db.execute(`
        ALTER TABLE admins ADD COLUMN last_login DATETIME NULL DEFAULT NULL
      `);
      console.log('Last login column added successfully.');
    } else {
      console.log('Last login column already exists.');
    }
    
    // Create password_resets table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(100) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Password reset table verified.');
    process.exit(0);
  } catch (error) {
    console.error('Error during database setup:', error);
    process.exit(1);
  }
}

createAdmin();