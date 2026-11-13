const pool = require('../config/db');

class TicketTier {
  static async findById(id) {
    const [rows] = await pool.query(`SELECT * FROM ticket_tiers WHERE id = ?`, [id]);
    return rows[0] || null;
  }

  static async findByEventId(eventId) {
    const [rows] = await pool.query(
      `SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY price ASC`,
      [eventId]
    );
    return rows;
  }

  static async create({ event_id, name, description, price, total_quantity, available_quantity }) {
    const qty = total_quantity || 0;
    const avail = available_quantity !== undefined ? available_quantity : qty;
    const [result] = await pool.query(
      `INSERT INTO ticket_tiers (event_id, name, description, price, total_quantity, available_quantity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [event_id, name, description, price, qty, avail]
    );
    return result.insertId;
  }

  static async update(id, { name, description, price, total_quantity, available_quantity }) {
    const [result] = await pool.query(
      `UPDATE ticket_tiers
       SET name = ?, description = ?, price = ?, total_quantity = ?, available_quantity = ?
       WHERE id = ?`,
      [name, description, price, total_quantity, available_quantity, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM ticket_tiers WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = TicketTier;
