// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine destination based on file type
    const isImage = file.mimetype.startsWith('image/');
    const dest = isImage ? './public/uploads/images' : './public/uploads/videos';
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension);
  }
});

const upload = multer({ storage: storage });

router.post('/upload', (req, res, next) => {
    console.log('Form data:', req.body);
    console.log('Files:', req.files);
    next();
  }, upload.single('file'), mediaController.uploadMedia);

// Upload routes
router.get('/upload', mediaController.getUploadForm);
router.post('/upload', upload.single('file'), mediaController.uploadMedia);

// Edit routes
router.get('/edit/:id', mediaController.getEditForm);
router.post('/edit/:id', upload.single('file'), mediaController.updateMedia);

// Delete route
router.delete('/delete/:id', mediaController.deleteMedia);

// Category filter route (Ajax)
router.get('/filter/:categoryId', mediaController.filterByCategory);

module.exports = router;