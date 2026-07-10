-- 25_rename_roles_menu_label.sql
-- [관리자 > 권한 관리] 메뉴 명칭을 [관리자 > 권한 그룹 관리]로 변경.
-- 실행 순서: 25번 (21~24 실행 후). 멱등(경로로 명시 매칭). UTF-8 저장.
SET client_encoding TO 'UTF8';

UPDATE menus SET name = '권한 그룹 관리', updated_at = now()
WHERE path = '/admin/roles' AND name = '권한 관리';
