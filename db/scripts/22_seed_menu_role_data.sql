-- 22_seed_menu_role_data.sql
-- 현재 하드코딩된 메뉴/역할/매핑 시드
-- 실행 순서: 22번 (21 실행 후)
-- 이 파일은 UTF-8 저장. 한글 Windows psql의 UHC 오인코딩 방지용으로 UTF8 고정.
SET client_encoding TO 'UTF8';

-- ── 역할 ─────────────────────────────────────────────
INSERT INTO roles (code, name, description) VALUES
  ('admin',   '관리자',   '전체 메뉴 접근 및 관리 기능'),
  ('partner', '파트너사', '파트너 포털 일반 사용자')
ON CONFLICT (code) DO NOTHING;

-- ── 대메뉴 (top nav, parent_id = NULL) ───────────────
INSERT INTO menus (parent_id, name, path, menu_type, admin_only, display_order) VALUES
  (NULL, 'HOME',     '/home',          'nav', false, 1),
  (NULL, '시작하기', '/guide',         'nav', false, 2),
  (NULL, 'API',      '/api-reference', 'nav', false, 3),
  (NULL, '운영 지원', '/support',       'nav', false, 4),
  (NULL, '관리자',   '/admin',         'nav', true,  5);

-- ── 관리자 서브탭 (parent = /admin) ──────────────────
INSERT INTO menus (parent_id, name, path, menu_type, icon, admin_only, display_order)
SELECT p.id, x.name, x.path, 'admin-tab', x.icon, true, x.ord
FROM (SELECT id FROM menus WHERE path = '/admin') p,
     (VALUES
        ('파트너사 코드 신청', '/admin/partners',  '👤', 1),
        ('방화벽·토큰 요청',   '/admin/firewall',  '🔓', 2),
        ('문의 확인',          '/admin/inquiries', '💬', 3),
        ('공지사항 관리',      '/admin/notices',   '📢', 4),
        ('API 등록/관리',      '/admin/apis',      '🧩', 5),
        ('메뉴 관리',          '/admin/menus',     '🗂', 6),  -- NEW
        ('권한 관리',          '/admin/roles',     '🔑', 7)   -- NEW
     ) AS x(name, path, icon, ord);

-- ── apiReference 사이드바 ─────────────────────────────
-- 계층: API 대메뉴 → 그룹(공통/리조트/에스테이트) → 문서(헤더/부대시설 등)
-- 출처: src/views/apiReference/index.ejs
-- 1) 그룹 헤더를 API 대메뉴의 자식으로
INSERT INTO menus (parent_id, name, path, menu_type, display_order)
SELECT p.id, x.name, NULL, 'group', x.ord
FROM (SELECT id FROM menus WHERE menu_type = 'nav' AND path = '/api-reference') p,
     (VALUES
        ('공통',       10),
        ('리조트',     20),
        ('에스테이트', 30)
     ) AS x(name, ord);

-- 2) 각 문서를 소속 그룹의 자식으로
INSERT INTO menus (parent_id, name, path, menu_type, display_order)
SELECT g.id, x.name, x.path, 'api-doc', x.ord
FROM menus g,
     (VALUES
        ('공통',       '헤더',            '/api-reference?doc=header',          11),
        ('공통',       '인증',            '/api-reference?doc=auth',            12),
        ('공통',       '에러 코드',       '/api-reference?doc=error-codes',     13),
        ('리조트',     '대형법인사',      '/api-reference?doc=condo',           21),
        ('리조트',     '골프장 키오스크', '/api-reference?doc=golf',             22),
        ('리조트',     '상품/쿠폰',       '/api-reference?doc=product',          23),
        ('리조트',     'H-LIVE포인트',    '/api-reference?doc=hlive',            24),
        ('에스테이트', '부대시설',        '/api-reference?doc=estate-facility',  31)
     ) AS x(group_name, name, path, ord)
WHERE g.menu_type = 'group' AND g.name = x.group_name;

-- ── 매핑: admin = 전체 메뉴 ──────────────────────────
INSERT INTO role_menus (role_id, menu_id)
SELECT r.id, m.id
FROM roles r CROSS JOIN menus m
WHERE r.code = 'admin'
ON CONFLICT DO NOTHING;

-- (partner 매핑은 이번 이터레이션 범위 밖 — 권한 관리 화면에서 지정)
