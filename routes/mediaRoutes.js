const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const mediaController = require('../controllers/mediaController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Cloudinary config - ensure these environment variables are set correctly
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 400 * 1024 * 1024 } // 400MB limit
});

// Helper function for uploading to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'uploads' },
      (error, result) => {
        if (result) {
          resolve({
            originalname: file.originalname,
            url: result.secure_url,
            public_id: result.public_id
          });
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// Route: POST /upload-media
router.post('/upload-media', upload.array('files', 10), async (req, res) => {
  try {
    console.log("Request body:", req.body);
    
    // Verify files are present
    const files = req.files || [];
    
    console.log("Request files count:", files.length);
    
    if (files.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'No files were uploaded' 
      });
    }

    // Pass control to the controller
    return mediaController.uploadMedia(req, res);
    
  } catch (err) {
    console.error("Error in upload route:", err);
    res.status(500).json({ 
      success: false,
      error: 'Upload failed', 
      details: err.message 
    });
  }
});

// Get Edit Form
router.get('/edit/:id', isAuthenticated, mediaController.getEditForm);

// Edit media (for updating files)
router.post('/edit/:id', isAuthenticated, upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'posterImage', maxCount: 1 }
]), mediaController.updateMedia);

// Delete media (single file)
router.post('/delete-file/:fileId', isAuthenticated, mediaController.deleteFile);

// Set a primary file (for image or video galleries)
router.post('/set-primary/:mediaId/:fileId', isAuthenticated, mediaController.setPrimaryFile);

// Get media details
router.get('/details/:id', isAuthenticated, mediaController.getMediaDetails);

// Filter media by category
router.get('/filter/:categoryId', mediaController.filterByCategory); // This one can remain public if needed

// Get upload form (e.g., for displaying the form to the user)
router.get('/upload', isAuthenticated, mediaController.getUploadForm);

// Delete media (e.g., for removing an entire media entry)
router.post('/delete/:id', isAuthenticated, mediaController.deleteMedia);

module.exports = router;
