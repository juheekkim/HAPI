-- 26_rename_partner_role_to_bigcorp.sql
-- 권한 그룹 코드 'partner' → 'BigCorp'로 전면 변경.
-- roles.code와 users.role은 문자열로 매칭되므로 둘 다 함께 바꿔야 로그인/메뉴 노출이 깨지지 않음
-- (참고: src/models/menuModel.js getNavMenusByRole).
-- 실행 순서: 26번 (21~25 실행 후). 멱등(값으로 명시 매칭). UTF-8 저장.
SET client_encoding TO 'UTF8';

UPDATE roles SET code = 'BigCorp', updated_at = now()
WHERE code = 'partner';

UPDATE users SET role = 'BigCorp'
WHERE role = 'partner';
