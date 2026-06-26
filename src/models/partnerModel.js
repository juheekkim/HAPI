'use strict';

const pool = require('../config/database');

const STATIC_PARTNERS = [
  { id: 1, company_name: '㈜여기눈자', manager_name: '홍길동', email: 'admin@ptnA.com', phone: '010-1234-5678', purpose: 'API 연동', status: 'pending', created_at: '2026-08-01' },
  { id: 2, company_name: '㈜저기눈자', manager_name: '이순신', email: 'biz@ptnB.kr', phone: '010-2345-6789', purpose: 'API 연동', status: 'approved', created_at: '2026-07-28', processed_at: '2026-07-29 10:15:00', partner_code: '20260729' },
  { id: 3, company_name: '㈜거기눈자', manager_name: '김철수', email: 'it@ptnC.co.kr', phone: '010-3456-7890', purpose: 'API 연동', status: 'rejected', reject_reason: '서류 미비', created_at: '2026-07-20', processed_at: '2026-07-21 09:30:00' },
];

const partnerModel = {
  async getAll() {
    try {
      const result = await pool.query('SELECT * FROM partners ORDER BY created_at DESC');
      return result.rows.length > 0 ? result.rows : STATIC_PARTNERS;
    } catch {
      return STATIC_PARTNERS;
    }
  },

  async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM partners WHERE id=$1 LIMIT 1', [id]);
      return result.rows[0] || null;
    } catch {
      return null;
    }
  },

  async create({ companyName, managerName, email, phone, purpose }) {
    const result = await pool.query(
      'INSERT INTO partners (company_name, manager_name, email, phone, purpose, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [companyName, managerName, email, phone, purpose, 'pending']
    );
    return result.rows[0];
  },

  async updateStatus(id, status, rejectReason = null, partnerCode = null) {
    await pool.query(
      'UPDATE partners SET status=$1, reject_reason=$2, processed_at=now(), partner_code=$3 WHERE id=$4',
      [status, rejectReason, partnerCode, id]
    );
  },
};

module.exports = partnerModel;
