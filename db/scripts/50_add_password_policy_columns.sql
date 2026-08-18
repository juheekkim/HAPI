-- 비밀번호 정책: 변경 주기(1년) 계산용 이력 컬럼 + 최초/관리자 강제 변경 플래그 추가.
-- password_changed_at 기본값 now() → 기존 계정은 이 스크립트 실행 시점부터 1년 유예.
-- IF NOT EXISTS라 재실행 안전.
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false;
