// routes/mediaRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const mediaController = require('../controllers/mediaController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Debug middleware to log uploaded files
const logRequest = (req, res, next) => {
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  next();
};

const upload = multer({ 
  storage: storage,
  fileFilter: function(req, file, cb) {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});


// Routes 
router.get('/upload', isAuthenticated, mediaController.getUploadForm);
router.post('/upload', isAuthenticated, upload.array('files', 10), logRequest, mediaController.uploadMedia);

router.get('/details/:id', isAuthenticated, mediaController.getMediaDetails);

router.get('/edit/:id', isAuthenticated, mediaController.getEditForm);
router.post('/edit/:id', isAuthenticated, upload.array('files', 10), logRequest, mediaController.updateMedia);

router.post('/delete/:id', isAuthenticated, mediaController.deleteMedia);
router.post('/delete-file/:fileId', isAuthenticated, mediaController.deleteFile);
router.post('/set-primary/:mediaId/:fileId', isAuthenticated, mediaController.setPrimaryFile);
router.get('/filter/:categoryId', mediaController.filterByCategory); // This one can remain public if needed

// API endpoint to get all files for a media
router.get('/api/media/:id/files', mediaController.getMediaFiles); // This one can remain public if needed

module.exports = router;