-- 24_restructure_api_menu_hierarchy.sql
-- API Reference 사이드바 계층 정상화:
--   변경 전) 그룹(공통/리조트/에스테이트)과 문서(헤더/부대시설 등)가 모두 API 대메뉴의 형제(직속 자식).
--   변경 후) 문서를 소속 그룹의 자식으로 re-parent → 그룹이 실제 부모가 됨.
-- role_menus는 menu id로 참조하므로 re-parent 후에도 매핑 보존. 멱등(경로로 명시 매칭).
-- 실행 순서: 24번 (22/23 실행 후). UTF-8 저장.
SET client_encoding TO 'UTF8';

-- 공통 그룹 하위로
UPDATE menus SET parent_id = (SELECT id FROM menus WHERE menu_type = 'group' AND name = '공통'), updated_at = now()
WHERE menu_type = 'api-doc'
  AND path IN ('/api-reference?doc=header', '/api-reference?doc=auth', '/api-reference?doc=error-codes');

-- 리조트 그룹 하위로
UPDATE menus SET parent_id = (SELECT id FROM menus WHERE menu_type = 'group' AND name = '리조트'), updated_at = now()
WHERE menu_type = 'api-doc'
  AND path IN ('/api-reference?doc=condo', '/api-reference?doc=golf', '/api-reference?doc=product', '/api-reference?doc=hlive');

-- 에스테이트 그룹 하위로
UPDATE menus SET parent_id = (SELECT id FROM menus WHERE menu_type = 'group' AND name = '에스테이트'), updated_at = now()
WHERE menu_type = 'api-doc'
  AND path = '/api-reference?doc=estate-facility';

-- API 대메뉴 경로 일반화 (랜딩 문서는 컨트롤러가 role의 첫 허용 문서로 결정)
UPDATE menus SET path = '/api-reference', updated_at = now()
WHERE menu_type = 'nav' AND path = '/api-reference?doc=header';
