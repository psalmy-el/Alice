const db = require('../config/database');

class Media {
  // Create main media entry
  static async create(media) {
    const query = `
      INSERT INTO media (title, description, type, category_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const [result] = await db.execute(query, [
      media.title,
      media.description,
      media.type,
      media.category_id
    ]);
    
    return result.insertId;
  }
  
  static async addFiles(mediaId, files) {
    try {
      // Instead of using transactions, we'll just execute queries directly
      const query = `
        INSERT INTO media_files (media_id, file_path, is_primary, created_at)
        VALUES (?, ?, ?, NOW())
      `;
      
      // Insert files one by one
      for (let i = 0; i < files.length; i++) {
        await db.execute(query, [
          mediaId,
          files[i].path,
          i === 0 ? 1 : 0 // First file is primary
        ]);
      }
      
      return true;
    } catch (error) {
      console.error('Error adding files:', error);
      throw error;
    }
  }

  // Get all media with their primary file
  static async getAll() {
    const query = `
      SELECT m.*, mf.file_path, c.name as category_name
      FROM media m
      LEFT JOIN (
        SELECT media_id, file_path
        FROM media_files
        WHERE is_primary = 1
      ) mf ON m.id = mf.media_id
      LEFT JOIN categories c ON m.category_id = c.id
      ORDER BY m.created_at DESC
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }
  
  // Get single media with all its files
  static async getById(id) {
    const mediaQuery = `
      SELECT m.*, c.name as category_name
      FROM media m
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.id = ?
    `;
    
    const filesQuery = `
      SELECT id, file_path, is_primary
      FROM media_files
      WHERE media_id = ?
      ORDER BY is_primary DESC, id ASC
    `;
    
    const [mediaRows] = await db.execute(mediaQuery, [id]);
    const [filesRows] = await db.execute(filesQuery, [id]);
    
    if (mediaRows.length === 0) {
      return null;
    }
    
    const media = mediaRows[0];
    media.files = filesRows;
    
    return media;
  }
  
  // Update media details
  static async update(id, media) {
    const query = `
      UPDATE media
      SET title = ?, description = ?, category_id = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await db.execute(query, [
      media.title,
      media.description,
      media.category_id,
      id
    ]);
    
    return true;
  }
  
  // Delete media and all associated files
  static async delete(id) {
    // Get all file paths first
    const filePathsQuery = `
      SELECT file_path FROM media_files WHERE media_id = ?
    `;
    
    const [fileRows] = await db.execute(filePathsQuery, [id]);
    
    // Delete from media_files table
    const deleteFilesQuery = `
      DELETE FROM media_files WHERE media_id = ?
    `;
    
    // Delete from main media table
    const deleteMediaQuery = `
      DELETE FROM media WHERE id = ?
    `;
    
    await db.execute(deleteFilesQuery, [id]);
    await db.execute(deleteMediaQuery, [id]);
    
    return fileRows.map(row => row.file_path);
  }
  
  // Add new files to existing media
  static async addNewFiles(mediaId, files) {
    return this.addFiles(mediaId, files);
  }
  
  // Delete specific file
  static async deleteFile(fileId) {
    // Get file path first
    const pathQuery = `
      SELECT file_path FROM media_files WHERE id = ?
    `;
    
    const [pathRows] = await db.execute(pathQuery, [fileId]);
    
    if (pathRows.length === 0) {
      return null;
    }
    
    const filePath = pathRows[0].file_path;
    
    // Delete the file record
    const deleteQuery = `
      DELETE FROM media_files WHERE id = ?
    `;
    
    await db.execute(deleteQuery, [fileId]);
    
    return filePath;
  }
  
  // Set a file as primary
  static async setPrimaryFile(fileId, mediaId) {
    // First, reset all files for this media to not primary
    const resetQuery = `
      UPDATE media_files SET is_primary = 0 WHERE media_id = ?
    `;
    
    // Then set the specified file as primary
    const setPrimaryQuery = `
      UPDATE media_files SET is_primary = 1 WHERE id = ? AND media_id = ?
    `;
    
    await db.execute(resetQuery, [mediaId]);
    await db.execute(setPrimaryQuery, [fileId, mediaId]);
    
    return true;
  }
  
  // Get media by category
  static async getByCategory(categoryId) {
    const query = `
      SELECT m.*, mf.file_path, c.name as category_name
      FROM media m
      LEFT JOIN (
        SELECT media_id, file_path
        FROM media_files
        WHERE is_primary = 1
      ) mf ON m.id = mf.media_id
      LEFT JOIN categories c ON m.category_id = c.id
      WHERE m.category_id = ?
      ORDER BY m.created_at DESC
    `;
    
    const [rows] = await db.execute(query, [categoryId]);
    return rows;
  }

  // Get a featured video for the intro section
  static async getFeaturedVideo() {
    const query = `
      SELECT m.*, mf.file_path
      FROM media m
      JOIN media_files mf ON m.id = mf.media_id
      WHERE m.type = 'video' AND m.is_intro = 1 AND mf.is_primary = 1
      LIMIT 1
    `;
    
    const [rows] = await db.execute(query);
    return rows.length > 0 ? rows[0] : null;
  }

    //handle intro video
    static async setAsIntroVideo(mediaId) {
    try {
      // First, unset any existing intro video
      const unsetQuery = `
        UPDATE media SET is_intro = 0 WHERE is_intro = 1
      `;
      
      // Then set the new intro video
      const setQuery = `
        UPDATE media SET is_intro = 1 WHERE id = ?
      `;
      
      // Execute both queries in sequence
      await db.execute(unsetQuery);
      await db.execute(setQuery, [mediaId]);
      
      console.log(`Successfully set media ID ${mediaId} as intro video`);
      return true;
    } catch (error) {
      console.error('Error setting intro video:', error);
      throw error;
    }
  }

  //handle poster images
  static async addPosterImage(mediaId, posterPath) {
    try {
      const query = `
        UPDATE media
        SET poster_image = ?, updated_at = NOW()
        WHERE id = ?
      `;
      
      console.log(`Adding poster image ${posterPath} to media ID ${mediaId}`);
      await db.execute(query, [posterPath, mediaId]);
      return true;
    } catch (error) {
      console.error('Error adding poster image:', error);
      throw error;
    }
  }

  // Delete all files for a specific media
  static async deleteAllFiles(mediaId) {
    try {
      const query = `
        DELETE FROM media_files WHERE media_id = ?
      `;
      
      await db.execute(query, [mediaId]);
      return true;
    } catch (error) {
      console.error('Error deleting all files:', error);
      throw error;
    }
  }

  static async updateType(id, type) {
    try {
      const query = `
        UPDATE media
        SET type = ?
        WHERE id = ?
      `;
      
      await db.execute(query, [type, id]);
      return true;
    } catch (error) {
      console.error('Error updating media type:', error);
      throw error;
    }
  }
}

module.exports = Media;