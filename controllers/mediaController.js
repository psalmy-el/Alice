// controllers/mediaController.js
const path = require('path');
const fs = require('fs').promises;
const Media = require('../models/mediaModel');
const Category = require('../models/categoryModel');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Display upload form
exports.getUploadForm = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.render('upload', { categories });
  } catch (error) {
    console.error('Error fetching categories for upload form:', error);
    res.status(500).render('error', { message: 'Failed to load upload form' });
  }
};

// Handle media upload with multiple files
exports.uploadMedia = async (req, res) => {
  try {
    const { title, description, category_id } = req.body;
    const isIntro = req.body.is_intro === 'true';
    
    // Validate required fields
    if (!title || !description || !category_id) {
      return res.status(400).json({
        success: false,
        message: `Please fill in all required fields: ${!title ? 'Title, ' : ''}${!description ? 'Description, ' : ''}${!category_id ? 'Category' : ''}`
      });
    }
    
    // Get files from the multer format
    const files = req.files && req.files.files ? req.files.files : [];
    const posterImage = req.files && req.files.posterImage ? req.files.posterImage[0] : null;
    
    console.log('Received files:', files.length);
    console.log('Received form data:', req.body);
    
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // Upload files to Cloudinary
    const cloudinaryFiles = await Promise.all(files.map(file => {
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
    }));
    
    // Upload poster image if it exists
    let cloudinaryPosterImage = null;
    if (posterImage) {
      cloudinaryPosterImage = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'posters' },
          (error, result) => {
            if (result) {
              resolve({
                originalname: posterImage.originalname,
                url: result.secure_url,
                public_id: result.public_id
              });
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(posterImage.buffer).pipe(stream);
      });
    }
    
    // Determine the type from the first file
    const type = files[0].mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Create the main media entry - adjust this according to your database model
    const mediaId = await Media.create({
      title,
      description,
      type,
      category_id
    });
    
    // Add files to the media entry - adjust according to your model
    await Media.addFiles(mediaId, cloudinaryFiles.map(file => ({
      path: file.url,
      public_id: file.public_id
    })));
    
    // Add poster image if it exists and this is a video
    if (cloudinaryPosterImage && type === 'video') {
      await Media.addPosterImage(mediaId, cloudinaryPosterImage.url, cloudinaryPosterImage.public_id);
    }
    
    // Set as intro video if requested and it's a video
    if (isIntro && type === 'video') {
      await Media.setAsIntroVideo(mediaId);
    }
    
    // Return success response
    res.json({
      success: true,
      message: 'Media uploaded successfully',
      mediaId: mediaId
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload media: ' + error.message
    });
  }
};

// Display media details
exports.getMediaDetails = async (req, res) => {
  try {
    const media = await Media.getById(req.params.id);
    
    if (!media) {
      return res.status(404).render('error', { message: 'Media not found' });
    }

    res.render('media-details', { media });
  } catch (error) {
    console.error('Error fetching media details:', error);
    res.status(500).render('error', { message: 'Failed to load media details' });
  }
};

// Display edit form
exports.getEditForm = async (req, res) => {
  try {
    const media = await Media.getById(req.params.id);
    
    if (!media) {
      return res.status(404).render('error', { message: 'Media not found' });
    }

    const categories = await Category.getAll();
    res.render('edit', { media, categories });
  } catch (error) {
    console.error('Error fetching media for edit:', error);
    res.status(500).render('error', { message: 'Failed to load edit form' });
  }
};

// Handle edit form submission
exports.updateMedia = async (req, res) => {
  try {
    const { title, description, category_id, replace_files } = req.body;
    const id = req.params.id;
    
    console.log('Update request received:', {
      id,
      title,
      description,
      category_id,
      replace_files,
      hasFiles: req.files && req.files.files ? req.files.files.length : 0,
      hasPoster: req.files && req.files.posterImage ? true : false
    });
    
    // Validate required fields
    if (!title || !description || !category_id) {
      return res.status(400).json({ 
        success: false, 
        message: `Please fill in all required fields: ${!title ? 'Title, ' : ''}${!description ? 'Description, ' : ''}${!category_id ? 'Category' : ''}`
      });
    }
    
    // First get the existing media to know what to delete
    const existingMedia = await Media.getById(id);
    
    // Update basic media information
    await Media.update(id, {
      title,
      description,
      category_id
    });
    
    // If new files were uploaded and replace_files is true
    if (req.files && req.files.files && req.files.files.length > 0 && replace_files === 'true') {
      console.log('Processing new files for replacement:', req.files.files.length);
      
      // Get existing file paths to delete them from Cloudinary
      const filesToDelete = existingMedia.files.map(file => {
        // Extract the public_id from Cloudinary URL
        const urlParts = file.file_path.split('/');
        const filenameWithExtension = urlParts[urlParts.length - 1];
        const publicId = 'uploads/' + filenameWithExtension.split('.')[0];
        return publicId;
      });
      
      // Delete all existing files from Cloudinary
      for (const publicId of filesToDelete) {
        try {
          console.log('Deleting file from Cloudinary:', publicId);
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error('Error deleting file from Cloudinary:', cloudinaryError);
          // Continue even if deletion fails
        }
      }
      
      // Delete old files from database
      await Media.deleteAllFiles(id);
      
      // Upload new files to Cloudinary
      const cloudinaryFiles = [];
      for (const file of req.files.files) {
        try {
          const cloudinaryResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: 'uploads' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
          });
          
          cloudinaryFiles.push({
            path: cloudinaryResult.secure_url,
            public_id: cloudinaryResult.public_id
          });
        } catch (uploadError) {
          console.error('Error uploading to Cloudinary:', uploadError);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to upload file to Cloudinary' 
          });
        }
      }
      
      // Add new files to database
      console.log('Adding new files:', cloudinaryFiles.length);
      await Media.addFiles(id, cloudinaryFiles.map(file => ({ path: file.path })));
      
      // If this is a video, determine media type
      if (req.files.files[0].mimetype.startsWith('video/')) {
        await Media.updateType(id, 'video');
      } else if (req.files.files[0].mimetype.startsWith('image/')) {
        await Media.updateType(id, 'image');
      }
    }
    
    // If a new poster image was uploaded, update it
    if (req.files && req.files.posterImage && req.files.posterImage.length > 0) {
      console.log('Processing new poster image');
      
      // If there's an existing poster, delete it first from Cloudinary
      if (existingMedia.poster_image) {
        try {
          const urlParts = existingMedia.poster_image.split('/');
          const filenameWithExtension = urlParts[urlParts.length - 1];
          const publicId = 'uploads/' + filenameWithExtension.split('.')[0];
          
          console.log('Deleting old poster from Cloudinary:', publicId);
          await cloudinary.uploader.destroy(publicId);
        } catch (cloudinaryError) {
          console.error('Error deleting poster from Cloudinary:', cloudinaryError);
          // Continue even if deletion fails
        }
      }
      
      // Upload new poster to Cloudinary
      try {
        const posterImage = req.files.posterImage[0];
        const cloudinaryResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'uploads' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(posterImage.buffer).pipe(uploadStream);
        });
        
        await Media.addPosterImage(id, cloudinaryResult.secure_url);
      } catch (uploadError) {
        console.error('Error uploading poster to Cloudinary:', uploadError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload poster image to Cloudinary' 
        });
      }
    }

    res.json({
      success: true,
      message: 'Media updated successfully'
    });
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update media: ' + error.message 
    });
  }
};;

// Get all files for a specific media
exports.getMediaFiles = async (req, res) => {
  try {
    const mediaId = req.params.id;
    const media = await Media.getById(mediaId);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }
    
    res.json({
      success: true,
      files: media.files
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch media files: ' + error.message 
    });
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  try {
    const filePaths = await Media.delete(req.params.id);
    
    if (!filePaths || filePaths.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete files from filesystem
    for (const filePath of filePaths) {
      try {
        await fs.unlink(path.join(__dirname, '../public', filePath));
      } catch (fileError) {
        console.error('Error deleting file:', fileError, filePath);
        // Continue even if file deletion fails
      }
    }
    
    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete media: ' + error.message 
    });
  }
};

// Delete specific file from media
exports.deleteFile = async (req, res) => {
  try {
    const filePath = await Media.deleteFile(req.params.fileId);
    
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Delete the file from filesystem
    try {
      await fs.unlink(path.join(__dirname, '../public', filePath));
    } catch (fileError) {
      console.error('Error deleting file from filesystem:', fileError);
      // Continue even if file deletion fails
    }
    
    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete file: ' + error.message 
    });
  }
};

// Set primary file
exports.setPrimaryFile = async (req, res) => {
  try {
    await Media.setPrimaryFile(req.params.fileId, req.params.mediaId);
    
    res.json({
      success: true,
      message: 'Primary file set successfully'
    });
  } catch (error) {
    console.error('Error setting primary file:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to set primary file: ' + error.message 
    });
  }
};

// Filter media by category
exports.filterByCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const media = await Media.getByCategory(categoryId);
    res.json(media);
  } catch (error) {
    console.error('Error filtering media by category:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to filter media: ' + error.message 
    });
  }
};