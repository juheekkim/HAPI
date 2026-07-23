-- 46_add_assistant_menu.sql
-- "AI 어시스턴트" 대메뉴(top nav) 신설 — /assistant 풀페이지 AI 대화 화면(실험적 컨셉).
-- docs/assistant.md, docs/menu-routing.md 참고. 이 파일은 UTF-8 저장(22번과 동일한 이유).
SET client_encoding TO 'UTF8';

-- 대메뉴 행. menus.path에는 unique 제약이 없어 WHERE NOT EXISTS로 재실행 안전을 보장한다.
INSERT INTO menus (parent_id, name, path, menu_type, admin_only, display_order)
SELECT NULL, 'AI 어시스턴트', '/assistant', 'nav', false, 6
WHERE NOT EXISTS (
  SELECT 1 FROM menus WHERE path = '/assistant' AND menu_type = 'nav'
);

-- 모든 역할에 노출한다(실험 기능 — 역할별 제한이 필요해지면 /admin/roles 화면에서 조정).
INSERT INTO role_menus (role_id, menu_id)
SELECT r.id, m.id
FROM roles r CROSS JOIN menus m
WHERE m.path = '/assistant' AND m.menu_type = 'nav'
ON CONFLICT DO NOTHING;
