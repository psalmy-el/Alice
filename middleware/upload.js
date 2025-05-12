// middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const imagePath = path.join(__dirname, '../public/uploads/images');
const videoPath = path.join(__dirname, '../public/uploads/videos');

if (!fs.existsSync(imagePath)) {
  fs.mkdirSync(imagePath, { recursive: true });
}

if (!fs.existsSync(videoPath)) {
  fs.mkdirSync(videoPath, { recursive: true });
}

// Storage configuration for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationFolder = file.mimetype.startsWith('image/') 
      ? 'public/uploads/images' 
      : 'public/uploads/videos';
    cb(null, destinationFolder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image or video file!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

module.exports = { upload };