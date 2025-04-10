const { pool } = require('../config/database');

class Category {
  // Get all categories
  static async getAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM categories ORDER BY name');
      return rows;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return []; // Return empty array instead of throwing error
    }
  }

  // Get category by ID
  static async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      console.error('Error fetching category by ID:', error);
      return null;
    }
  }
}

module.exports = Category;