-- 27_add_partner_role_mapping.sql
-- 파트너사(코드)별 권한그룹 매핑: partners.role_id → roles.id.
-- "사용자별 권한관리"(/admin/partner-roles) 화면에서 관리자가 파트너사마다 권한그룹 1개를 지정하면,
-- 해당 파트너 로그인 사용자에게 그 그룹의 role_menus가 적용되어 노출 메뉴가 달라진다
-- (src/middlewares/loadNavMenus.js, src/controllers/apiReferenceController.js에서 세션 role보다 우선 적용).
-- 매핑이 없으면 users.role(현재 BigCorp) 그대로 사용(fallback, graceful degradation 정책 유지).
-- 실행 순서: 27번 (21~26 실행 후). 멱등. UTF-8 저장.
SET client_encoding TO 'UTF8';

ALTER TABLE partners ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;

-- 기존 승인 파트너는 현재 사용 중인 BigCorp 그룹으로 기본 매핑(동작 연속성 유지)
UPDATE partners SET role_id = (SELECT id FROM roles WHERE code = 'BigCorp')
WHERE status = 'approved' AND role_id IS NULL;

-- 관리자 메뉴 하위에 "사용자별 권한관리" 서브탭 추가
INSERT INTO menus (parent_id, name, path, icon, admin_only, display_order)
SELECT (SELECT id FROM menus WHERE path = '/admin'), '사용자별 권한관리', '/admin/partner-roles', '🧑‍💼', true, 8
WHERE NOT EXISTS (SELECT 1 FROM menus WHERE path = '/admin/partner-roles');

-- admin 권한그룹에 매핑(관리자는 전체 메뉴 매핑 정책 유지)
INSERT INTO role_menus (role_id, menu_id)
SELECT (SELECT id FROM roles WHERE code = 'admin'), (SELECT id FROM menus WHERE path = '/admin/partner-roles')
ON CONFLICT DO NOTHING;
