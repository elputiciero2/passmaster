const pool = require('../config/db');

class Event {
  static async getAll({ status = null, search = null }) {
    let query = `
      SELECT e.*, 
             u.name as creator_name,
             COALESCE(SUM(tt.total_quantity), 0) as configured_capacity,
             COALESCE(SUM(tt.available_quantity), 0) as available_capacity,
             COALESCE(SUM(tt.total_quantity - tt.available_quantity), 0) as sold_tickets
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN ticket_tiers tt ON e.id = tt.event_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND e.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (e.title LIKE ? OR e.location LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY e.id ORDER BY e.event_date ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async findById(id) {
    const [events] = await pool.query(
      `SELECT e.*, u.name as creator_name
       FROM events e
       LEFT JOIN users u ON e.created_by = u.id
       WHERE e.id = ?`,
      [id]
    );

    if (events.length === 0) return null;

    const event = events[0];

    // Cargar tiers / localidades asociadas
    const [tiers] = await pool.query(
      `SELECT * FROM ticket_tiers WHERE event_id = ? ORDER BY price ASC`,
      [id]
    );

    event.tiers = tiers;
    return event;
  }

  static async create({ title, description, location, event_date, banner_url, max_capacity, status = 'PUBLISHED', created_by }) {
    const [result] = await pool.query(
      `INSERT INTO events (title, description, location, event_date, banner_url, max_capacity, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, location, event_date, banner_url, max_capacity, status, created_by]
    );
    return result.insertId;
  }

  static async update(id, { title, description, location, event_date, banner_url, max_capacity, status }) {
    const [result] = await pool.query(
      `UPDATE events 
       SET title = ?, description = ?, location = ?, event_date = ?, banner_url = ?, max_capacity = ?, status = ?
       WHERE id = ?`,
      [title, description, location, event_date, banner_url, max_capacity, status, id]
    );
    return result.affectedRows > 0;
  }

  static async delete(id) {
    const [result] = await pool.query(`DELETE FROM events WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  static async getRealtimeOccupancy(eventId) {
    const [rows] = await pool.query(
      `SELECT 
         e.id as event_id,
         e.title,
         e.max_capacity,
         COALESCE(SUM(tt.total_quantity), 0) as total_configured,
         COALESCE(SUM(tt.total_quantity - tt.available_quantity), 0) as total_sold,
         COALESCE(SUM(tt.available_quantity), 0) as total_available,
         (
           SELECT COUNT(t.id) 
           FROM tickets t
           JOIN ticket_tiers ttr ON t.ticket_tier_id = ttr.id
           WHERE ttr.event_id = e.id AND t.status = 'CHECKED_IN'
         ) as total_checked_in
       FROM events e
       LEFT JOIN ticket_tiers tt ON e.id = tt.event_id
       WHERE e.id = ?
       GROUP BY e.id`,
      [eventId]
    );

    return rows[0] || null;
  }
}

module.exports = Event;
