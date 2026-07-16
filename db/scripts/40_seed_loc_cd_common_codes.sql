-- 40_seed_loc_cd_common_codes.sql
-- "공통 코드" 화면에 영업장코드(LOC_CD) 그룹 15건 추가(사업장코드/BRCH_CD에 이어 두 번째 그룹).
-- 실행 순서: 40번(39 이후). 멱등(group_code+detail_code로 존재 여부 확인 후 INSERT).
SET client_encoding TO 'UTF8';

INSERT INTO common_codes (group_code, group_name, detail_code, description, display_order)
SELECT * FROM (VALUES
  ('LOC_CD', '영업장코드', '0101', '설악 쏘라노', 1),
  ('LOC_CD', '영업장코드', '0102', '설악 별관', 2),
  ('LOC_CD', '영업장코드', '0401', '용인 베잔송', 3),
  ('LOC_CD', '영업장코드', '0701', '산정호수 안시', 4),
  ('LOC_CD', '영업장코드', '0801', '해운대', 5),
  ('LOC_CD', '영업장코드', '0901', '대천 파로스', 6),
  ('LOC_CD', '영업장코드', '1001', '경주 에톤', 7),
  ('LOC_CD', '영업장코드', '1002', '경주 담톤', 8),
  ('LOC_CD', '영업장코드', '1101', '제주', 9),
  ('LOC_CD', '영업장코드', '1601', '평창', 10),
  ('LOC_CD', '영업장코드', '2101', '거제 벨버디어', 11),
  ('LOC_CD', '영업장코드', '2102', '거제 르씨엘', 12),
  ('LOC_CD', '영업장코드', '2201', '여수 벨메르', 13),
  ('LOC_CD', '영업장코드', '2401', '양양브리드', 14),
  ('LOC_CD', '영업장코드', '2601', 'MATIE OSIRIA', 15)
) AS v(group_code, group_name, detail_code, description, display_order)
WHERE NOT EXISTS (
  SELECT 1 FROM common_codes WHERE group_code = v.group_code AND detail_code = v.detail_code
);
