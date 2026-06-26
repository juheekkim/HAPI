-- 01_create_tables.sql
-- HAPI 포털 테이블 생성 스크립트
-- 실행 순서: 1번

-- 사용자 (관리자 / 파트너사 담당자)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'user', -- 'admin' | 'user'
  partner_id    INTEGER,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 파트너사
CREATE TABLE IF NOT EXISTS partners (
  id            SERIAL PRIMARY KEY,
  company_name  VARCHAR(200) NOT NULL,
  manager_name  VARCHAR(100) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  phone         VARCHAR(50),
  purpose       TEXT,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reject_reason TEXT,
  partner_code  VARCHAR(8)   UNIQUE,
  processed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 방화벽/토큰 요청
CREATE TABLE IF NOT EXISTS firewall_requests (
  id              SERIAL PRIMARY KEY,
  partner_code    VARCHAR(8)   REFERENCES partners(partner_code) ON DELETE SET NULL,
  ip_address      VARCHAR(100) NOT NULL,
  port            VARCHAR(20)  NOT NULL,
  reason          TEXT,
  approval_status VARCHAR(20)  NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reject_reason   TEXT,
  payment_status  VARCHAR(20),  -- 'pending' | 'inprogress' | 'completed'
  token           VARCHAR(100),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 공지사항
CREATE TABLE IF NOT EXISTS notices (
  id         SERIAL PRIMARY KEY,
  tag        VARCHAR(50)  NOT NULL,
  tag_type   VARCHAR(20)  NOT NULL DEFAULT 'notice', -- 'new' | 'notice' | 'update'
  title      VARCHAR(500) NOT NULL,
  content    TEXT,
  is_visible BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 문의 (Q&A)
CREATE TABLE IF NOT EXISTS inquiries (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  question    TEXT    NOT NULL,
  answer      TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending' | 'answered'
  is_faq      BOOLEAN     NOT NULL DEFAULT FALSE,
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API 스펙 (DB 관리 시 사용)
CREATE TABLE IF NOT EXISTS api_specs (
  id            SERIAL PRIMARY KEY,
  category      VARCHAR(50)  NOT NULL, -- 'resort' | 'estate' | 'common'
  domain        VARCHAR(50)  NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  endpoints     JSONB        NOT NULL DEFAULT '[]',
  error_codes   JSONB        NOT NULL DEFAULT '[]',
  display_order INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_partners_status           ON partners(status);
CREATE INDEX IF NOT EXISTS idx_firewall_approval_status  ON firewall_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_notices_created_at        ON notices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_status          ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_api_specs_category        ON api_specs(category);
