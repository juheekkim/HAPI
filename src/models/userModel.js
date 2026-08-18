'use strict';

const pool = require('../config/database');

const userModel = {
  async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await pool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] || null;
  },

  async create({ username, passwordHash, name, role, partnerId = null, mustChangePassword = false }) {
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, name, role, partner_id, must_change_password)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [username, passwordHash, name, role, partnerId, mustChangePassword]
    );
    return result.rows[0];
  },

  async updatePassword(id, passwordHash) {
    const result = await pool.query(
      `UPDATE users SET password_hash = $1, password_changed_at = now(), must_change_password = false
       WHERE id = $2 RETURNING *`,
      [passwordHash, id]
    );
    return result.rows[0];
  },
};

module.exports = userModel;
