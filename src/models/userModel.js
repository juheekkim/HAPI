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

  async create({ username, passwordHash, name, role, partnerId = null }) {
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, name, role, partner_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [username, passwordHash, name, role, partnerId]
    );
    return result.rows[0];
  },
};

module.exports = userModel;
