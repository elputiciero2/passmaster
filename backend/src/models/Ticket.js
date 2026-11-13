const pool = require('../config/db');

class Ticket {
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT t.*, 
              tt.name as tier_name, tt.price as tier_price,
              e.id as event_id, e.title as event_title, e.location as event_location, e.event_date,
              o.order_number, o.payment_status,
              u.name as buyer_name, u.email as buyer_email
       FROM tickets t
       JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
       JOIN events e ON tt.event_id = e.id
       JOIN orders o ON t.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async findByCode(ticketCode) {
    const [rows] = await pool.query(
      `SELECT t.*, 
              tt.name as tier_name, tt.price as tier_price,
              e.id as event_id, e.title as event_title, e.location as event_location, e.event_date,
              o.order_number, o.payment_status,
              u.name as buyer_name, u.email as buyer_email
       FROM tickets t
       JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
       JOIN events e ON tt.event_id = e.id
       JOIN orders o ON t.order_id = o.id
       JOIN users u ON o.user_id = u.id
       WHERE t.ticket_code = ?`,
      [ticketCode]
    );
    return rows[0] || null;
  }

  static async getByUserId(userId) {
    const [rows] = await pool.query(
      `SELECT t.*, 
              tt.name as tier_name, tt.price as tier_price,
              e.id as event_id, e.title as event_title, e.location as event_location, e.event_date, e.banner_url,
              o.order_number
       FROM tickets t
       JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
       JOIN events e ON tt.event_id = e.id
       JOIN orders o ON t.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY e.event_date DESC, t.id DESC`,
      [userId]
    );
    return rows;
  }

  static async getByOrderId(orderId) {
    const [rows] = await pool.query(
      `SELECT t.*, 
              tt.name as tier_name, tt.price as tier_price,
              e.id as event_id, e.title as event_title, e.location as event_location, e.event_date
       FROM tickets t
       JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
       JOIN events e ON tt.event_id = e.id
       WHERE t.order_id = ?`,
      [orderId]
    );
    return rows;
  }

  static async updateStatus(ticketId, status, checkedInAt = new Date()) {
    const [result] = await pool.query(
      `UPDATE tickets SET status = ?, checked_in_at = ? WHERE id = ?`,
      [status, checkedInAt, ticketId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Ticket;
