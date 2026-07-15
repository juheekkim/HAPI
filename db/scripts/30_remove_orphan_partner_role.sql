-- 30_remove_orphan_partner_role.sql
-- 29번 스냅샷에 포함된 고아 role 정리: 26번(rename 'partner'→'BigCorp') 실행 후
-- 22번 시드 스크립트가 원 작성자 로컬에서 재실행되면서 code='partner' role이 다시 생성된 채로
-- 데이터에 남았고, 그 상태가 29번 스냅샷에 그대로 포함되어 배포됨.
-- 어떤 users.role/partners.role_id도 참조하지 않는 완전한 고아 데이터(role_menus만 재시드로 15건 매핑됨).
-- roles 삭제 시 role_menus는 ON DELETE CASCADE로 함께 정리됨(21번 FK 정의).
-- 실행 순서: 30번 (21~29 실행 후). 멱등(코드로 명시 매칭, 없으면 0건). UTF-8 저장.
SET client_encoding TO 'UTF8';

DELETE FROM roles WHERE code = 'partner';
