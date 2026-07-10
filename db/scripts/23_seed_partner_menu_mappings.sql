-- 23_seed_partner_menu_mappings.sql
-- partner 역할에 '관리자 제외 전체 메뉴'(admin_only=false)를 매핑.
-- 헤더/사이드바 동적 렌더링 도입 후 partner가 빈 메뉴로 보이던 문제 복구.
-- 실행 순서: 23번 (22 실행 후). 재실행 안전(ON CONFLICT DO NOTHING).
-- UTF-8 저장 파일. 한글 Windows psql의 UHC 오인코딩 방지용 인코딩 고정.
SET client_encoding TO 'UTF8';

INSERT INTO role_menus (role_id, menu_id)
SELECT r.id, m.id
FROM roles r
CROSS JOIN menus m
WHERE r.code = 'partner'
  AND m.admin_only = false
ON CONFLICT DO NOTHING;
