-- 35_remove_auth_api_doc_menu.sql
-- API Reference 사이드바 "공통 > 인증" 문서 메뉴(doc=auth) 삭제 요청. 로그인/로그아웃/파트너코드
-- 신청은 API Reference가 다루는 대외 API가 아니라 포털 자체 기능이라 실제 api_specs(domain='auth')
-- 항목 없이 참고용으로만 남아 있었다. 관리자 > 메뉴관리 화면에서 삭제하는 것과 동일한 효과.
-- role_menus.menu_id는 ON DELETE CASCADE라 매핑(role_id 1, 2)도 함께 정리된다.
-- 실행 순서: 35번(24 이후 아무 때나). 멱등(name+path+menu_type으로 명시 매칭).
SET client_encoding TO 'UTF8';

DELETE FROM menus
WHERE name = '인증'
  AND path = '/api-reference?doc=auth'
  AND menu_type = 'api-doc';
