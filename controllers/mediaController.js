// controllers/mediaController.js
const path = require('path');
const fs = require('fs').promises;
const Media = require('../models/mediaModel');
const Category = require('../models/categoryModel');

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
    const files = req.files;
    const isIntro = req.body.is_intro === 'true';

    // Debug log to see what's being received
    console.log('Received files:', files);
    console.log('Received form data:', req.body);
    console.log('Is intro video:', isIntro);

    if (!files || files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No files uploaded' 
      });
    }

    // Determine the type from the first file
    const type = files[0].mimetype.startsWith('image/') ? 'image' : 'video';
    
    // Create the main media entry
    const mediaId = await Media.create({
      title,
      description,
      type,
      category_id
    });

    // Process all files
    const processedFiles = files.map(file => {
      const relativePath = path.relative('public', file.path).replace(/\\/g, '/');
      return {
        path: '/' + relativePath
      };
    });

    // Add files to the media entry
    await Media.addFiles(mediaId, processedFiles);
    
    // Set as intro video if requested and it's a video
    if (isIntro && type === 'video') {
      await Media.setAsIntroVideo(mediaId);
      console.log(`Set media ID ${mediaId} as intro video`);
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
    const { title, description, category_id } = req.body;
    const id = req.params.id;
    
    // Update basic media information
    await Media.update(id, {
      title,
      description,
      category_id
    });
    
    // If new files were uploaded, add them
    if (req.files && req.files.length > 0) {
      const processedFiles = req.files.map(file => {
        const relativePath = path.relative('public', file.path).replace(/\\/g, '/');
        return {
          path: '/' + relativePath
        };
      });
      
      await Media.addNewFiles(id, processedFiles);
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
};

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