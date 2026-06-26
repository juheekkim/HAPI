'use strict';

/**
 * 초기 어드민 계정 생성 스크립트
 * 실행: npm run db:setup
 */
const bcrypt = require('bcrypt');
const pool = require('../config/database');

async function setup() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (username, name, role, password_hash)
     VALUES ('admin', '관리자', 'admin', $1)
     ON CONFLICT (username) DO UPDATE SET password_hash = $1`,
    [hash]
  );
  console.log('✔ 어드민 계정 생성 완료: admin / admin123');
  await pool.end();
}

setup().catch((err) => {
  console.error('Setup 실패:', err);
  process.exit(1);
});
