'use strict';

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/hapi_db' });

async function run() {
  const code = '61396454';
  const hash = await bcrypt.hash(code, 10);
  await pool.query(
    'INSERT INTO users (username, password_hash, name, role, partner_id) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (username) DO UPDATE SET password_hash=$2',
    [code, hash, '김주희', 'partner', 1]
  );
  console.log('파트너 계정 생성 완료:', code);
  await pool.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
