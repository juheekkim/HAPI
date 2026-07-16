-- 41_seed_corp_cd_common_code.sql
-- "공통 코드" 화면 맨 위에 법인코드(CORP_CD) 그룹 추가. 그룹 정렬은 commonCodeModel.getAllGrouped()의
-- `ORDER BY MIN(display_order)` 기준이라, 기존 그룹(BRCH_CD/LOC_CD, 그룹 내 display_order가 1부터
-- 시작)보다 앞에 오도록 0을 사용한다.
-- 실행 순서: 41번(39 이후). 멱등(group_code+detail_code로 존재 여부 확인 후 INSERT).
SET client_encoding TO 'UTF8';

INSERT INTO common_codes (group_code, group_name, detail_code, description, display_order)
SELECT * FROM (VALUES
  ('CORP_CD', '법인코드', '1000', '한화호텔앤드리조트', 0)
) AS v(group_code, group_name, detail_code, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM common_codes WHERE group_code = v.group_code AND detail_code = v.detail_code
);
