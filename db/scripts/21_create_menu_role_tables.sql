-- 21_create_menu_role_tables.sql
-- 메뉴 관리 / 권한 관리 테이블 생성
-- roles(역할) + menus(계층 메뉴) + role_menus(역할↔메뉴 매핑)
-- 실행 순서: 21번 (01, 07, 16~20 실행 후)
-- 이 파일은 UTF-8 저장. 한글 Windows psql이 client_encoding을 UHC로 잡아
-- 한글 주석/데이터가 깨지는 것을 방지하기 위해 UTF8로 고정한다.
SET client_encoding TO 'UTF8';

-- 역할(권한 그룹)
CREATE TABLE IF NOT EXISTS roles (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE,      -- 'admin' | 'partner' ...
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   BOOLEAN      NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 메뉴 (계층 구조: 대메뉴 / admin 서브탭 / apiReference 사이드바)
CREATE TABLE IF NOT EXISTS menus (
  id            SERIAL PRIMARY KEY,
  parent_id     INTEGER      REFERENCES menus(id) ON DELETE CASCADE, -- 최상위는 NULL
  name          VARCHAR(100) NOT NULL,
  path          VARCHAR(255),                     -- 링크(그룹 헤더는 NULL 가능)
  menu_type     VARCHAR(20)  NOT NULL DEFAULT 'nav', -- 'nav' | 'admin-tab' | 'api-doc' | 'group'
  icon          VARCHAR(20),                      -- 이모지(선택)
  admin_only    BOOLEAN      NOT NULL DEFAULT false,
  display_order INTEGER      NOT NULL DEFAULT 0,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- 역할↔메뉴 매핑 (복합 PK, 양쪽 CASCADE)
CREATE TABLE IF NOT EXISTS role_menus (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, menu_id)
);

CREATE INDEX IF NOT EXISTS idx_menus_parent_id     ON menus(parent_id);
CREATE INDEX IF NOT EXISTS idx_menus_display_order ON menus(display_order);
CREATE INDEX IF NOT EXISTS idx_role_menus_menu_id  ON role_menus(menu_id);
