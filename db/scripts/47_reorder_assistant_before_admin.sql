-- 47_reorder_assistant_before_admin.sql
-- 상단 대메뉴 순서 변경: /admin/menus 화면에서 "AI 어시스턴트"를 "관리자" 앞으로 재배치한
-- 결과(로컬 DB에만 반영되어 있던 display_order 변경)를 스크립트로 고정해 팀 공유.
-- 46번 시드 당시에는 AI 어시스턴트=6, 관리자=5였으나, 이후 관리자 화면에서 순서를 바꿔
-- 현재는 AI 어시스턴트=5, 관리자=6이 실제 운영 중인 순서.
-- 멱등(path+menu_type로 특정 행만 지정, 항상 같은 값으로 덮어씀). UTF-8 저장.
SET client_encoding TO 'UTF8';

UPDATE menus SET display_order = 5 WHERE path = '/assistant' AND menu_type = 'nav';
UPDATE menus SET display_order = 6 WHERE path = '/admin' AND menu_type = 'nav';
