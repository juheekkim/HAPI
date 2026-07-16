-- 39_create_common_codes_table.sql
-- API Reference "공통 > 공통 코드"(menus.id=75, doc=common-codes) 화면용 코드 그룹 테이블 신설.
-- 대분류(그룹명+그룹코드, 예: 사업장코드/BRCH_CD) 아래 세부 코드(Code)-설명(Message)이 여러 건
-- 딸린 구조라 header_fields/system_info와 같은 "그룹 rowspan" 패턴을 그대로 따른다.
-- 관리자 UI 없이 db/scripts INSERT로 관리(system_info와 동일한 이유 — 그룹 종류가 계속 늘어날 수 있음).
-- 실행 순서: 39번(01 이후 아무 때나). 멱등(group_code+detail_code로 존재 여부 확인 후 INSERT).
SET client_encoding TO 'UTF8';

CREATE TABLE IF NOT EXISTS common_codes (
  id SERIAL PRIMARY KEY,
  group_code VARCHAR(30) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  detail_code VARCHAR(30) NOT NULL,
  description VARCHAR(200) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_common_codes_group_code ON common_codes (group_code);

-- 사업장코드(BRCH_CD) 12건 시드
INSERT INTO common_codes (group_code, group_name, detail_code, description, display_order)
SELECT * FROM (VALUES
  ('BRCH_CD', '사업장코드', '0100', '설악', 1),
  ('BRCH_CD', '사업장코드', '0400', '용인', 2),
  ('BRCH_CD', '사업장코드', '0700', '산정호수', 3),
  ('BRCH_CD', '사업장코드', '0800', '해운대', 4),
  ('BRCH_CD', '사업장코드', '0900', '대천', 5),
  ('BRCH_CD', '사업장코드', '1000', '경주', 6),
  ('BRCH_CD', '사업장코드', '1100', '제주', 7),
  ('BRCH_CD', '사업장코드', '1600', '평창', 8),
  ('BRCH_CD', '사업장코드', '2100', '거제', 9),
  ('BRCH_CD', '사업장코드', '2200', '여수 벨메르', 10),
  ('BRCH_CD', '사업장코드', '2400', '브리드호텔 양양', 11),
  ('BRCH_CD', '사업장코드', '2600', '마티에 오시리아', 12)
) AS v(group_code, group_name, detail_code, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM common_codes WHERE group_code = v.group_code AND detail_code = v.detail_code
);
