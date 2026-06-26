'use strict';

const pool = require('../config/database');
const crypto = require('crypto');

const STATIC_REQUESTS = [
  { id: 1, company_name: '㈜여기눈자', contact: 'admin@ptnA.com', ip_address: '1.2.3.4', port: '443', requested_at: '2026-08-01 14:22', approval_status: 'pending', payment_status: null, token: null, reject_reason: null },
  { id: 2, company_name: '㈜저기눈자', contact: 'biz@ptnB.kr', ip_address: '5.6.7.8', port: '8443', requested_at: '2026-08-02 09:10', approval_status: 'rejected', payment_status: null, token: null, reject_reason: 'IP 형식 오류', processed_at: '2026-08-02 09:15:00' },
  { id: 3, company_name: '㈜거기눈자', contact: 'it@ptnC.co.kr', ip_address: '9.10.11.12', port: '443', requested_at: '2026-08-03 11:00', approval_status: 'approved', payment_status: 'pending', token: null, reject_reason: null, processed_at: '2026-08-03 11:20:00' },
  { id: 4, company_name: '㈜에헤라', contact: 'dev@ptnD.net', ip_address: '13.14.15.16', port: '443', requested_at: '2026-08-04 15:30', approval_status: 'approved', payment_status: 'inprogress', token: null, reject_reason: null, processed_at: '2026-08-04 15:45:00' },
  { id: 5, company_name: '㈜디아', contact: 'info@ptnE.com', ip_address: '17.18.19.20', port: '443', requested_at: '2026-07-28 10:05', approval_status: 'approved', payment_status: 'completed', token: 'TK-E-2507001', reject_reason: null, processed_at: '2026-07-28 10:30:00' },
];

const firewallModel = {
  async getAll() {
    try {
      const result = await pool.query(`
        SELECT f.*, p.company_name, p.email AS contact
        FROM firewall_requests f
        LEFT JOIN partners p ON f.partner_code = p.partner_code
        ORDER BY f.created_at DESC
      `);
      return result.rows.length > 0 ? result.rows : STATIC_REQUESTS;
    } catch {
      return STATIC_REQUESTS;
    }
  },

  async create({ partnerCode, ipAddress, port, reason }) {
    const result = await pool.query(
      'INSERT INTO firewall_requests (partner_code, ip_address, port, reason, approval_status) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [partnerCode, ipAddress, port, reason, 'pending']
    );
    return result.rows[0];
  },

  async updateStatus(id, status, rejectReason = null) {
    await pool.query(
      'UPDATE firewall_requests SET approval_status=$1, reject_reason=$2, processed_at=now() WHERE id=$3',
      [status, rejectReason, id]
    );
  },

  async issueToken(id) {
    const token = `HNRTK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    await pool.query(
      'UPDATE firewall_requests SET token=$1, payment_status=$2 WHERE id=$3',
      [token, 'completed', id]
    );
    return token;
  },
};

module.exports = firewallModel;
