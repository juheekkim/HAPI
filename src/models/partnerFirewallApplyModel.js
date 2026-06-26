'use strict';

const pool = require('../config/database');

const partnerFirewallApplyModel = {
  async getAll() {
    try {
      const result = await pool.query(`
        SELECT
          a.*,
          u.name         AS user_name,
          p.company_name,
          p.partner_code,
          p.manager_name AS partner_manager_name,
          p.email        AS partner_email,
          p.phone        AS partner_phone
        FROM partner_firewall_applies a
        LEFT JOIN users    u ON a.user_id   = u.id
        LEFT JOIN partners p ON u.partner_id = p.id
        ORDER BY a.requested_at DESC
      `);
      return result.rows;
    } catch {
      return [];
    }
  },

  async getByUserId(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM partner_firewall_applies WHERE user_id = $1 ORDER BY requested_at ASC',
        [userId]
      );
      return result.rows;
    } catch {
      return [];
    }
  },

  async create({ userId, sourceIp, sourceHostname, note, destIp, destHostname, destPort }) {
    const result = await pool.query(
      'INSERT INTO partner_firewall_applies (user_id, source_ip, source_hostname, note, dest_ip, dest_hostname, dest_port) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, sourceIp, sourceHostname, note || null, destIp || null, destHostname || null, destPort || '443']
    );
    return result.rows[0];
  },

  async approve(id) {
    // 토큰 채번: HWRXXXXXXXX (8자리 숫자 난수)
    const rand = String(Math.floor(10000000 + Math.random() * 90000000));
    const token = `HWR${rand}`;
    await pool.query(
      "UPDATE partner_firewall_applies SET approval_status = 'approved', approved_at = now(), token = $1 WHERE id = $2",
      [token, id]
    );
  },

  async reject(id, reason) {
    await pool.query(
      "UPDATE partner_firewall_applies SET approval_status = 'rejected', approved_at = now(), reject_reason = $2 WHERE id = $1",
      [id, reason || null]
    );
  },
};

module.exports = partnerFirewallApplyModel;
