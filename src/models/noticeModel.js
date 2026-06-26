'use strict';

const pool = require('../config/database');

const STATIC_NOTICES = [
  { id: 1, tag: '공지 NEW', tag_type: 'new', title: '[필독] API 인증 방식 변경 안내 (Bearer Token)', created_at: '2025.08.01' },
  { id: 2, tag: '공지', tag_type: 'notice', title: '스테이징 서버 점검 일정 안내 (8/15 02:00~06:00)', created_at: '2025.07.28' },
  { id: 3, tag: '업데이트', tag_type: 'update', title: '콘도예약 API v2.1 배포 안내 – 파라미터 추가', created_at: '2025.07.20' },
  { id: 4, tag: '공지', tag_type: 'notice', title: '추석 연휴 운영 안내 (9/15~9/17 긴급 대응팀 운영)', created_at: '2025.07.10' },
];

const noticeModel = {
  async getAll() {
    try {
      const result = await pool.query('SELECT * FROM notices ORDER BY created_at DESC');
      return result.rows.length > 0 ? result.rows : STATIC_NOTICES;
    } catch {
      return STATIC_NOTICES;
    }
  },

  async getAllForAdmin() {
    const result = await pool.query('SELECT * FROM notices ORDER BY created_at DESC');
    return result.rows;
  },

  async getVisible() {
    try {
      const result = await pool.query(
        'SELECT * FROM notices WHERE is_visible = true ORDER BY created_at DESC'
      );
      return result.rows.length > 0 ? result.rows : STATIC_NOTICES;
    } catch {
      return STATIC_NOTICES;
    }
  },

  async create({ tag, tagType, title, content, isVisible }) {
    const result = await pool.query(
      'INSERT INTO notices (tag, tag_type, title, content, is_visible) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [tag, tagType, title, content, isVisible !== false]
    );
    return result.rows[0];
  },

  async update(id, { tag, tagType, title, content, isVisible }) {
    const result = await pool.query(
      'UPDATE notices SET tag=$1, tag_type=$2, title=$3, content=$4, is_visible=$5 WHERE id=$6 RETURNING *',
      [tag, tagType, title, content, isVisible !== false, id]
    );
    return result.rows[0];
  },

  async toggleVisible(id) {
    const result = await pool.query(
      'UPDATE notices SET is_visible = NOT is_visible WHERE id=$1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM notices WHERE id=$1', [id]);
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM notices WHERE id=$1', [id]);
    return result.rows[0];
  },
};

module.exports = noticeModel;
