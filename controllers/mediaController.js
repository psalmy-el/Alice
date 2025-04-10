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

// Handle media upload
exports.uploadMedia = async (req, res) => {
  try {
    const { title, description, category_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).render('error', { message: 'No file uploaded' });
    }

    const type = file.mimetype.startsWith('image/') ? 'image' : 'video';
    const filePath = '/' + path.relative('public', file.path).replace(/\\/g, '/');
    
    await Media.create({
      title,
      description,
      file_path: filePath,
      type,
      category_id
    });

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).render('error', { message: 'Failed to upload media' });
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
    
    // Basic update data
    const updateData = {
      title,
      description,
      category_id
    };
    
    // If a new file was uploaded, add the file path and type
    if (req.file) {
      const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
      const filePath = '/' + path.relative('public', req.file.path).replace(/\\/g, '/');
      
      // Add file info to the update data
      updateData.file_path = filePath;
      updateData.type = type;
      
      // Get the old file path for potential deletion
      const oldFilePath = await Media.getFilePath(id);
      
      // Update the database with all data including the new file
      await Media.updateWithFile(id, updateData);
      
      // Optionally delete the old file
      try {
        if (oldFilePath) {
          await fs.unlink(path.join(__dirname, '../public', oldFilePath));
        }
      } catch (fileError) {
        console.error('Error deleting old file:', fileError);
        // Continue even if file deletion fails
      }
    } else {
      // Update without changing the file
      await Media.update(id, updateData);
    }

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error updating media:', error);
    res.status(500).render('error', { message: 'Failed to update media' });
  }
};

// Delete media
exports.deleteMedia = async (req, res) => {
  try {
    const filePath = await Media.getFilePath(req.params.id);
    
    if (!filePath) {
      return res.status(404).render('error', { message: 'Media not found' });
    }

    // Delete from database
    await Media.delete(req.params.id);
    
    // Delete file from filesystem (optional - uncomment if you want to delete files)
    try {
      await fs.unlink(path.join(__dirname, '../public', filePath));
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).render('error', { message: 'Failed to delete media' });
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
    res.status(500).json({ error: 'Failed to filter media' });
  }
};