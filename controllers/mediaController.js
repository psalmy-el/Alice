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
   
    // Get files from the request
    const files = req.files || [];
   
    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
   
    // Upload files to Cloudinary with resource_type based on file type
    const cloudinaryFiles = await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        // Determine resource_type based on file mimetype
        let resourceType = 'auto'; // Let Cloudinary auto-detect
        
        if (file.mimetype.startsWith('video/')) {
          resourceType = 'video';
        } else if (file.mimetype.startsWith('image/')) {
          resourceType = 'image';
        }

        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'uploads',
            resource_type: resourceType,
          },
          (error, result) => {
            if (result) {
              resolve({
                originalname: file.originalname,
                url: result.secure_url,
                public_id: result.public_id
              });
            } else {
              console.error('Cloudinary upload error:', error);
              reject(error);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    }));
   
    // Determine the type from the first file
    const type = files[0].mimetype.startsWith('image/') ? 'image' : 'video';
   
    // Create the main media entry
    const mediaId = await Media.create({
      title,
      description,
      type,
      category_id
    });
   
    // Add files to the media entry
    await Media.addFiles(mediaId, cloudinaryFiles.map(file => ({
      path: file.url,
      public_id: file.public_id
    })));
       
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
          // Determine resource type based on file extension
          const isVideo = existingMedia.type === 'video';
          const resourceType = isVideo ? 'video' : 'image';
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
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
          // Determine resource type based on file mimetype
          const resourceType = file.mimetype.startsWith('video/') ? 'video' : 'image';
          
          const cloudinaryResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { 
                folder: 'uploads',
                resource_type: resourceType // Specify resource type
              },
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
            message: 'Failed to upload file to Cloudinary: ' + uploadError.message 
          });
        }
      }
      
      // Add new files to database
      await Media.addFiles(id, cloudinaryFiles);
      
      // If this is a video, determine media type
      if (req.files.files[0].mimetype.startsWith('video/')) {
        await Media.updateType(id, 'video');
      } else if (req.files.files[0].mimetype.startsWith('image/')) {
        await Media.updateType(id, 'image');
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
    
    // Normalize file data and ensure all files have necessary properties
    const normalizedFiles = media.files.map(file => ({
      id: file.id,
      file_path: file.file_path,
      path: file.file_path, // Add path for compatibility
      type: media.type === 'video' || file.file_path.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image',
      is_primary: file.is_primary === 1 || file.is_primary === true
    }));
    
    // Ensure primary file is first in the array
    const sortedFiles = [
      ...normalizedFiles.filter(file => file.is_primary),
      ...normalizedFiles.filter(file => !file.is_primary)
    ];
      
    res.json({
      success: true,
      files: sortedFiles
    });
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch media files: ' + error.message 
    });
  }
};

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  
  try {
    // Extract the public ID from Cloudinary URL
    // Example URL: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/uploads/abcdef123456
    // We need to extract: uploads/abcdef123456
    const parts = url.split('/');
    const uploadIndex = parts.findIndex(part => part === 'upload');
    
    if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
      // Join all parts after 'upload' to get the full public_id including folder
      return parts.slice(uploadIndex + 2).join('/');
    }
    return null;
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
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
    
    // Delete files from Cloudinary
    const deletePromises = filePaths.map(filePath => {
      const publicId = getPublicIdFromUrl(filePath);
      if (publicId) {
        return new Promise((resolve) => {
          cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) {
              console.error('Error deleting from Cloudinary:', error);
            }
            resolve();
          });
        });
      }
      return Promise.resolve();
    });
    
    // Wait for all Cloudinary deletions to complete
    await Promise.all(deletePromises);
    
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
    
    // Delete the file from Cloudinary
    const publicId = getPublicIdFromUrl(filePath);
    if (publicId) {
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error('Error deleting from Cloudinary:', error);
          }
          resolve();
        });
      });
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