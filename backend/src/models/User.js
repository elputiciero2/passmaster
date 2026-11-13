const pool = require('../config/db');

class User {
  static async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  static async create({ name, email, password_hash, role = 'CUSTOMER' }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [name, email, password_hash, role]
    );
    return result.insertId;
  }

  static async getAllStaff() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE role IN ("STAFF", "ADMIN") ORDER BY name ASC'
    );
    return rows;
  }
}

module.exports = User;
