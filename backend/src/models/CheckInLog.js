const pool = require('../config/db');

class CheckInLog {
  static async create({ ticket_id, scanned_by_user_id, result, device_info = 'Web Scanner' }) {
    const [res] = await pool.query(
      `INSERT INTO check_in_logs (ticket_id, scanned_by_user_id, result, device_info)
       VALUES (?, ?, ?, ?)`,
      [ticket_id, scanned_by_user_id, result, device_info]
    );
    return res.insertId;
  }

  static async getLogsByEvent(eventId, limit = 50) {
    const [rows] = await pool.query(
      `SELECT cl.*, 
              t.ticket_code,
              tt.name as tier_name,
              u.name as staff_name,
              e.title as event_title
       FROM check_in_logs cl
       JOIN tickets t ON cl.ticket_id = t.id
       JOIN ticket_tiers tt ON t.ticket_tier_id = tt.id
       JOIN events e ON tt.event_id = e.id
       JOIN users u ON cl.scanned_by_user_id = u.id
       WHERE e.id = ?
       ORDER BY cl.scan_timestamp DESC
       LIMIT ?`,
      [eventId, limit]
    );
    return rows;
  }
}

module.exports = CheckInLog;
