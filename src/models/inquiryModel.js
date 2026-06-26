'use strict';

const pool = require('../config/database');

const STATIC_INQUIRIES = [
  { id: 1, status: 'answered', question: 'Q. 콘도예약 API 호출 시 401 오류가 발생합니다', answer: 'A. 토큰 만료 여부를 확인하고 재발급 신청해주세요.' },
  { id: 2, status: 'answered', question: 'Q. 방화벽 해제 처리 기간은 얼마나 걸리나요?', answer: 'A. 신청 후 1~2 영업일 이내 처리됩니다.' },
  { id: 3, status: 'pending', question: 'Q. 골프 예약 API에서 예약 취소 시 환불 처리는 어떻게 되나요?', answer: null },
];

const inquiryModel = {
  async getFaqs() {
    try {
      const result = await pool.query(
        "SELECT * FROM inquiries WHERE is_faq = TRUE AND status = 'answered' ORDER BY created_at DESC"
      );
      return result.rows;
    } catch {
      return [];
    }
  },

  async getAll() {
    try {
      const result = await pool.query(
        `SELECT i.*, u.name AS user_name
         FROM inquiries i
         LEFT JOIN users u ON i.user_id = u.id
         ORDER BY i.created_at DESC`
      );
      return result.rows;
    } catch {
      return [];
    }
  },

  async getRecent(limit = 5) {
    try {
      const result = await pool.query(
        'SELECT * FROM inquiries ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows.length > 0 ? result.rows : STATIC_INQUIRIES;
    } catch {
      return STATIC_INQUIRIES;
    }
  },

  async getByUserId(userId) {
    try {
      const result = await pool.query(
        'SELECT * FROM inquiries WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows;
    } catch {
      return [];
    }
  },

  async create({ userId, question }) {
    await pool.query(
      'INSERT INTO inquiries (user_id, question, status) VALUES ($1, $2, $3)',
      [userId, question, 'pending']
    );
  },

  async createByAdmin({ userId, question, answer }) {
    await pool.query(
      "INSERT INTO inquiries (user_id, question, answer, status, answered_at) VALUES ($1, $2, $3, 'answered', now())",
      [userId, question, answer]
    );
  },

  async answer(id, answerText) {
    await pool.query(
      "UPDATE inquiries SET answer = $1, status = 'answered', answered_at = now() WHERE id = $2",
      [answerText, id]
    );
  },

  async toggleFaq(id) {
    await pool.query(
      'UPDATE inquiries SET is_faq = NOT is_faq WHERE id = $1',
      [id]
    );
  },
};

module.exports = inquiryModel;
