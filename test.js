// test-db.js
const { pool, testConnection } = require('./config/database');

async function runTest() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('Connection successful!');
      
      // Test a simple query
      try {
        const [rows] = await pool.query('SHOW TABLES');
        console.log('Tables in database:', rows);
      } catch (queryError) {
        console.error('Query failed:', queryError);
      }
    }
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest();