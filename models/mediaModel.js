 // models/mediaModel.js
const { pool } = require('../config/database');

class Media {
  // Get all media
  static async getAll() {
    const [rows] = await pool.query(
      `SELECT media.*, categories.name as category_name 
       FROM media 
       LEFT JOIN categories ON media.category_id = categories.id 
       ORDER BY media.created_at DESC`
    );
    return rows;
  }
  
  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT media.*, categories.name as category_name 
       FROM media 
       LEFT JOIN categories ON media.category_id = categories.id 
       WHERE media.id = ?`,
      [id]
    );
    return rows[0];
  }
  
  static async create(data) {
    const { title, description, file_path, type, category_id } = data;
    const [result] = await pool.query(
      `INSERT INTO media (title, description, file_path, type, category_id)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, file_path, type, category_id]
    );
    return result.insertId;
  }
  
  // Update media
  static async updateWithFile(id, data) {
    const { title, description, category_id, file_path, type } = data;
    const [result] = await pool.query(
      `UPDATE media SET title = ?, description = ?, category_id = ?, file_path = ?, type = ?
       WHERE id = ?`,
      [title, description, category_id, file_path, type, id]
    );
    return result.affectedRows;
  }

  // Delete media
  static async delete(id) {
    const [result] = await pool.query('DELETE FROM media WHERE id = ?', [id]);
    return result.affectedRows;
  }

  // Get file path by id
  static async getFilePath(id) {
    const [rows] = await pool.query('SELECT file_path FROM media WHERE id = ?', [id]);
    return rows[0]?.file_path;
  }
  
  // Get media by type
  static async getByType(type) {
    const [rows] = await pool.query(
      `SELECT media.*, categories.name as category_name 
       FROM media 
       LEFT JOIN categories ON media.category_id = categories.id 
       WHERE media.type = ?
       ORDER BY media.created_at DESC`,
      [type]
    );
    return rows;
  }
  
  static async getByCategory(categoryId) {
    const [rows] = await pool.query(
      `SELECT media.*, categories.name as category_name 
       FROM media 
       LEFT JOIN categories ON media.category_id = categories.id 
       WHERE media.category_id = ?
       ORDER BY media.created_at DESC`,
      [categoryId]
    );
    return rows;
  }
}

module.exports = Media;


// models/mediaModel.js
// const { pool } = require('../config/database');

// class Media {
//   // Get all media items
//   static async getAll() {
//     try {
//       const [rows] = await pool.query(`
//         SELECT m.*, c.name as category_name 
//         FROM media m
//         LEFT JOIN categories c ON m.category_id = c.id
//         ORDER BY m.created_at DESC
//       `);
//       return rows;
//     } catch (error) {
//       console.error('Error fetching media:', error);
//       return []; // Return empty array instead of throwing error
//     }
//   }

//   // Get media by ID
//   static async getById(id) {
//     try {
//       const [rows] = await pool.query('SELECT * FROM media WHERE id = ?', [id]);
//       return rows[0];
//     } catch (error) {
//       console.error('Error fetching media by ID:', error);
//       return null;
//     }
//   }
// }

// module.exports = Media;