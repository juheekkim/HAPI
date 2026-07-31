-- 49_add_common_codes_menu.sql
-- 이 DB에는 "공통 코드" API 문서 메뉴가 아예 없었다(39_create_common_codes_table.sql로 데이터 테이블
-- common_codes는 있지만 대응 menus 행이 없어, /api-reference?doc=common-codes로 들어가면 항상 header로
-- 리다이렉트됨 — allowedDocs가 menus/role_menus 기준이라 menus 행이 없으면 아예 도달 불가).
-- 형제 메뉴(헤더=id16, 에러 코드=id18, 둘 다 parent_id=13 "공통" 그룹, admin+BigCorp만 매핑)와 동일하게
-- 추가한다. display_order=12는 헤더(11)-에러 코드(13) 사이 원래 비어 있던 자리에 맞춘 값.
SET client_encoding TO 'UTF8';

INSERT INTO menus (parent_id, name, path, menu_type, icon, admin_only, display_order, is_active)
SELECT 13, '공통 코드', '/api-reference?doc=common-codes', 'api-doc', NULL, false, 12, true
WHERE NOT EXISTS (
  SELECT 1 FROM menus WHERE path = '/api-reference?doc=common-codes'
);

INSERT INTO role_menus (role_id, menu_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menus m
WHERE m.path = '/api-reference?doc=common-codes'
  AND r.code IN ('admin', 'BigCorp')
ON CONFLICT (role_id, menu_id) DO NOTHING;
