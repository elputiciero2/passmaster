const pool = require('../config/db');

class Order {
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByOrderNumber(orderNumber) {
    const [rows] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ?`,
      [orderNumber]
    );
    return rows[0] || null;
  }

  static async getByUser(userId) {
    const [orders] = await pool.query(
      `SELECT o.*, 
              COUNT(t.id) as ticket_count
       FROM orders o
       LEFT JOIN tickets t ON o.id = t.order_id
       WHERE o.user_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [userId]
    );
    return orders;
  }

  static async getAllOrders() {
    const [orders] = await pool.query(
      `SELECT o.*, u.name as user_name, u.email as user_email,
              COUNT(t.id) as ticket_count
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN tickets t ON o.id = t.order_id
       GROUP BY o.id
       ORDER BY o.created_at DESC`
    );
    return orders;
  }
}

module.exports = Order;
