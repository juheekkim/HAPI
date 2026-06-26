-- 07_partner_firewall_applies.sql
-- 파트너사 자체 방화벽 신청 테이블 생성
-- 실행 순서: 7번

CREATE TABLE IF NOT EXISTS partner_firewall_applies (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source_ip       VARCHAR(100) NOT NULL,
  source_hostname VARCHAR(255) NOT NULL,
  dest_ip         VARCHAR(100),
  dest_hostname   VARCHAR(255),
  dest_port       VARCHAR(20),
  approval_status VARCHAR(20)  NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reject_reason   TEXT,
  token           VARCHAR(100),
  note            TEXT,
  requested_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  approved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pfa_user ON partner_firewall_applies(user_id);
