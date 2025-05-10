const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Make sure you have dotenv installed

console.log('Checking Cloudinary configuration...');

// Log environment variables (redacted for security)
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set ✓' : 'Not set ✗');
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set ✓' : 'Not set ✗');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set ✓' : 'Not set ✗');

// Configure Cloudinary
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  
  console.log('Cloudinary configuration loaded successfully');
  
  // Test uploading a simple file
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  // Create a simple test image if it doesn't exist
  if (!fs.existsSync(testImagePath)) {
    console.log('Creating test image...');
    // This is a 1x1 transparent PNG
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, buffer);
    console.log('Test image created');
  }
  
  console.log('Attempting to upload test image to Cloudinary...');
  
  cloudinary.uploader.upload(testImagePath, {
    folder: 'test',
    public_id: 'test-upload-' + Date.now()
  }, (error, result) => {
    if (error) {
      console.error('❌ Cloudinary upload test failed:', error.message);
      console.error('Please check your Cloudinary configuration and network connectivity');
    } else {
      console.log('✅ Cloudinary upload test succeeded!');
      console.log('Test image URL:', result.secure_url);
      
      // Clean up test file
      fs.unlinkSync(testImagePath);
      console.log('Test image deleted');
      
      // Try deleting the test image from Cloudinary
      cloudinary.uploader.destroy(result.public_id, (error, result) => {
        if (error) {
          console.error('❌ Failed to delete test image from Cloudinary:', error.message);
        } else {
          console.log('✅ Test image deleted from Cloudinary');
        }
      });
    }
  });
} catch (err) {
  console.error('❌ Error setting up Cloudinary:', err.message);
  
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('\nMissing environment variables. Please check your .env file contains:');
    console.error('CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.error('CLOUDINARY_API_KEY=your_api_key');
    console.error('CLOUDINARY_API_SECRET=your_api_secret');
  }
}
