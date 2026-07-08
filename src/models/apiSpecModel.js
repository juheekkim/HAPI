'use strict';

const pool = require('../config/database');

// 정적 fallback — DB 미연결 시 사용
const STATIC_SPECS = [
  {
    category: 'resort',
    domain: 'condo',
    name: '콘도 예약 API',
    description: '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다. 파트너사 시스템에서 실시간 예약 처리가 가능합니다.',
    endpoints: [
      {
        method: 'POST',
        url: '/api/v1/resort/condo/reserve',
        description: '예약 등록',
        params: [
          { name: 'partnerId', type: 'String', required: true, desc: '파트너사 고유 코드' },
          { name: 'checkIn', type: 'String', required: true, desc: '입실일 (YYYY-MM-DD)' },
          { name: 'checkOut', type: 'String', required: true, desc: '퇴실일 (YYYY-MM-DD)' },
          { name: 'roomType', type: 'String', required: false, desc: '객실 유형 코드 (기본: STANDARD)' },
          { name: 'guestCount', type: 'Integer', required: false, desc: '투숙 인원 수' },
        ],
        responseExample: '{\n  "resultCode": "0000",\n  "resultMsg": "예약이 완료되었습니다.",\n  "data": {\n    "reservationId": "RSV-20250801-000123",\n    "status": "CONFIRMED",\n    "checkIn": "2025-09-01",\n    "checkOut": "2025-09-03"\n  }\n}',
      },
      {
        method: 'GET',
        url: '/api/v1/resort/condo/reserve/{id}',
        description: '예약 조회',
        params: [{ name: 'id', type: 'String', required: true, desc: '예약 ID (Path Variable)' }],
        responseExample: null,
      },
      {
        method: 'DELETE',
        url: '/api/v1/resort/condo/reserve/{id}',
        description: '예약 취소',
        params: [{ name: 'id', type: 'String', required: true, desc: '예약 ID (Path Variable)' }],
        responseExample: null,
      },
    ],
  },
  {
    category: 'resort',
    domain: 'golf',
    name: '골프 예약 API',
    description: '한화 골프클럽 티타임 예약을 관리하는 API입니다.',
    endpoints: [
      {
        method: 'POST',
        url: '/api/v1/resort/golf/reserve',
        description: '티타임 예약',
        params: [
          { name: 'partnerId', type: 'String', required: true, desc: '파트너사 코드' },
          { name: 'teeDate', type: 'String', required: true, desc: '티타임 날짜 (YYYY-MM-DD)' },
          { name: 'teeTime', type: 'String', required: true, desc: '티타임 시간 (HH:mm)' },
          { name: 'playerCount', type: 'Integer', required: false, desc: '플레이어 수 (기본: 4)' },
        ],
        responseExample: '{\n  "resultCode": "0000",\n  "resultMsg": "티타임 예약이 완료되었습니다.",\n  "data": { "reservationId": "GOLF-20250801-000045" }\n}',
      },
    ],
  },
  {
    category: 'resort',
    domain: 'product',
    name: '상품/쿠폰 API',
    description: '리조트 상품 조회 및 쿠폰 적용 API입니다.',
    endpoints: [
      {
        method: 'GET',
        url: '/api/v1/resort/products',
        description: '상품 목록 조회',
        params: [
          { name: 'category', type: 'String', required: false, desc: '상품 카테고리 (ROOM/GOLF/PACKAGE)' },
          { name: 'startDate', type: 'String', required: false, desc: '조회 시작일' },
          { name: 'endDate', type: 'String', required: false, desc: '조회 종료일' },
        ],
        responseExample: null,
      },
    ],
  },
  {
    category: 'resort',
    domain: 'hlive',
    name: 'H-LIVE 포인트 API',
    description: 'H-LIVE 멤버십 포인트 조회 및 적립/사용 API입니다.',
    endpoints: [
      {
        method: 'GET',
        url: '/api/v1/hlive/points/{memberId}',
        description: '포인트 조회',
        params: [{ name: 'memberId', type: 'String', required: true, desc: '멤버십 ID (Path Variable)' }],
        responseExample: null,
      },
    ],
  },
  {
    category: 'estate',
    domain: 'estate',
    name: '에스테이트 숙박 예약 API',
    description: '에스테이트 객실 예약 관련 API입니다.',
    endpoints: [
      {
        method: 'POST',
        url: '/api/v1/estate/reserve',
        description: '객실 예약',
        params: [
          { name: 'partnerId', type: 'String', required: true, desc: '파트너사 코드' },
          { name: 'checkIn', type: 'String', required: true, desc: '입실일' },
          { name: 'checkOut', type: 'String', required: true, desc: '퇴실일' },
        ],
        responseExample: null,
      },
    ],
  },
  {
    category: 'estate',
    domain: 'estate-facility',
    name: '부대시설 예약 API',
    description: '에스테이트 내 부대시설(레스토랑, 스파 등) 예약 API입니다.',
    endpoints: [
      {
        method: 'GET',
        url: '/api/v1/estate/facilities',
        description: '부대시설 목록 조회',
        params: [],
        responseExample: null,
      },
    ],
  },
  {
    category: 'common',
    domain: 'error-codes',
    name: '공통 에러 코드',
    description: '모든 API에서 공통으로 사용하는 에러 코드 정의입니다.',
    endpoints: [],
    errorCodes: [
      { code: '0000', http: 200, desc: '성공' },
      { code: '0001', http: 400, desc: '유효하지 않은 파트너사 코드' },
      { code: '0002', http: 401, desc: '인증 토큰 만료' },
      { code: '0003', http: 403, desc: '접근 권한 없음' },
      { code: '0004', http: 404, desc: '리소스를 찾을 수 없음' },
      { code: '9999', http: 500, desc: '서버 내부 오류' },
    ],
  },
  {
    category: 'common',
    domain: 'auth',
    name: '인증 API',
    description: 'JWT 토큰 발급 및 갱신 API입니다.',
    endpoints: [
      {
        method: 'POST',
        url: '/api/v1/auth/token',
        description: '토큰 발급',
        params: [
          { name: 'partnerId', type: 'String', required: true, desc: '파트너사 코드' },
          { name: 'partnerKey', type: 'String', required: true, desc: '파트너사 Secret Key' },
        ],
        responseExample: '{\n  "resultCode": "0000",\n  "data": {\n    "accessToken": "eyJhbGciOiJIUzI1NiIs...",\n    "expiresIn": 3600\n  }\n}',
      },
    ],
  },
];

const apiSpecModel = {
  async getAll() {
    try {
      const result = await pool.query(
        'SELECT * FROM api_specs ORDER BY display_order, id'
      );
      if (result.rows.length > 0) {
        return result.rows.map((r) => ({
          ...r,
          endpoints: r.endpoints || [],
          errorCodes: r.error_codes || [],
        }));
      }
    } catch {
      // DB 미연결 시 정적 데이터 사용
    }
    return STATIC_SPECS;
  },

  // 관리자 화면 전용 — STATIC fallback 없이 DB 실제 상태만 반환
  async getAllForAdmin() {
    const result = await pool.query('SELECT * FROM api_specs ORDER BY display_order, id');
    return result.rows.map((r) => ({
      ...r,
      endpoints: r.endpoints || [],
      errorCodes: r.error_codes || [],
    }));
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM api_specs WHERE id=$1', [id]);
    const row = result.rows[0];
    if (!row) return null;
    return { ...row, endpoints: row.endpoints || [], errorCodes: row.error_codes || [] };
  },

  async create({ category, domain, name, description, endpoints, displayOrder }) {
    const result = await pool.query(
      `INSERT INTO api_specs (category, domain, name, description, endpoints, display_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [category, domain, name, description, JSON.stringify(endpoints || []), displayOrder || 0]
    );
    return result.rows[0];
  },

  async update(id, { category, domain, name, description, endpoints, displayOrder }) {
    const result = await pool.query(
      `UPDATE api_specs SET category=$1, domain=$2, name=$3, description=$4, endpoints=$5, display_order=$6
       WHERE id=$7 RETURNING *`,
      [category, domain, name, description, JSON.stringify(endpoints || []), displayOrder || 0, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM api_specs WHERE id=$1', [id]);
  },
};

module.exports = apiSpecModel;
