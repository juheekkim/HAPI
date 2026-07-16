-- 32_create_system_info_table.sql
-- API Reference "전문구조" 탭의 "시스템 정보" 표가 index.ejs에 하드코딩(LCB 한 줄)돼 있었으나,
-- 운영 중 시스템 코드(LCB 외 OCH 등)가 계속 추가되는 구조라 코드 배포 없이 데이터만 추가해
-- 반영되도록 DB 테이블로 이전한다. 관리자 CRUD 화면은 아직 없음 — 신규 시스템은 이 파일과
-- 같은 형식으로 새 번호의 스크립트를 추가해 INSERT한다(db/scripts는 공통 영역 — 팀 공유 후 추가).
-- 실행 순서: 32번(01 이후 아무 때나). 멱등(system_code로 존재 여부 확인 후 INSERT). UTF-8 저장.
SET client_encoding TO 'UTF8';

CREATE TABLE IF NOT EXISTS system_info (
  id SERIAL PRIMARY KEY,
  system_name VARCHAR(100) NOT NULL,
  system_code VARCHAR(20) NOT NULL,
  protocol VARCHAR(20),
  division VARCHAR(50),
  source VARCHAR(100),
  target VARCHAR(200),
  message_format VARCHAR(50),
  charset VARCHAR(20),
  remark VARCHAR(200),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_info_system_code ON system_info (system_code);

-- index.ejs에 하드코딩돼 있던 것 중 실사용이 확인된 LCB만 이전(회원/비회원 2행 구조 유지).
-- OCH 등 그 외 시스템은 정확한 값(시스템명/Protocol/Target/전문포맷/문자코드/비고)이 확인되는
-- 대로 다음 스크립트에서 추가한다.
INSERT INTO system_info (system_name, system_code, protocol, division, source, target, message_format, charset, remark, display_order)
SELECT * FROM (VALUES
  ('대형법인사업체', 'LCB', 'HTTPS', '회원',   '—', '한화 리조트 대외채널 MCI', 'JSON String', 'UTF-8', '—', 1),
  ('대형법인사업체', 'LCB', 'HTTPS', '비회원', '—', '한화 리조트 대외채널 MCI', 'JSON String', 'UTF-8', '—', 2)
) AS v(system_name, system_code, protocol, division, source, target, message_format, charset, remark, display_order)
WHERE NOT EXISTS (SELECT 1 FROM system_info WHERE system_code = 'LCB');
