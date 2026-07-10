-- 28_local_data_snapshot.sql
-- 로컬 개발 DB의 현재 데이터 스냅샷(pg_dump --data-only --column-inserts --disable-triggers).
-- 재실행 시 아래 10개 테이블을 TRUNCATE 후 전량 재적재(멱등, RESTART IDENTITY CASCADE로 시퀀스도 초기화).
-- 스키마는 이 스크립트에 포함되지 않음 — 01~27 스크립트가 이미 적용된 DB에서만 실행할 것.
-- 실행 순서: 28번 (01~27 실행 후). UTF-8 저장.
SET client_encoding TO 'UTF8';

TRUNCATE TABLE
  users, partners, firewall_requests, notices, inquiries,
  api_specs, partner_firewall_applies, roles, menus, role_menus
  RESTART IDENTITY CASCADE;

--
-- PostgreSQL database dump
--


-- Dumped from database version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: api_specs; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.api_specs DISABLE TRIGGER ALL;

INSERT INTO public.api_specs (id, category, domain, name, description, endpoints, error_codes, display_order, created_at) VALUES (1, 'resort', 'condo', '콘도 예약 API', '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다.', '[{"url": "/api/v1/resort/condo/reserve", "method": "POST", "params": [{"desc": "파트너사 고유 코드", "name": "partnerId", "type": "String", "required": true}, {"desc": "입실일 (YYYY-MM-DD)", "name": "checkIn", "type": "String", "required": true}, {"desc": "퇴실일 (YYYY-MM-DD)", "name": "checkOut", "type": "String", "required": true}, {"desc": "객실 유형 코드", "name": "roomType", "type": "String", "required": false}, {"desc": "투숙 인원 수", "name": "guestCount", "type": "Integer", "required": false}], "description": "예약 등록", "responseExample": "{\"resultCode\":\"0000\",\"resultMsg\":\"예약이 완료되었습니다.\",\"data\":{\"reservationId\":\"RSV-20250801-000123\",\"status\":\"CONFIRMED\"}}"}, {"url": "/api/v1/resort/condo/reserve/{id}", "method": "GET", "params": [{"desc": "예약 ID (Path Variable)", "name": "id", "type": "String", "required": true}], "description": "예약 조회", "responseExample": null}, {"url": "/api/v1/resort/condo/reserve/{id}", "method": "DELETE", "params": [{"desc": "예약 ID (Path Variable)", "name": "id", "type": "String", "required": true}], "description": "예약 취소", "responseExample": null}]', '[]', 1, '2026-06-26 14:29:27.107837+09');


ALTER TABLE public.api_specs ENABLE TRIGGER ALL;

--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.roles DISABLE TRIGGER ALL;

INSERT INTO public.roles (id, code, name, description, is_active, created_at, updated_at) VALUES (2, 'BigCorp', '대형법인사', '대형법인사 예약을 위한 권한그룹', true, '2026-07-10 16:35:33.075123+09', '2026-07-10 17:13:59.708696+09');
INSERT INTO public.roles (id, code, name, description, is_active, created_at, updated_at) VALUES (1, 'admin', '관리자', '전체 메뉴 접근 및 관리 기능', true, '2026-07-10 16:35:33.075123+09', '2026-07-10 17:19:39.15055+09');
INSERT INTO public.roles (id, code, name, description, is_active, created_at, updated_at) VALUES (3, 'GolfLover', '골프 관련 업체', '골프장 키오스크, 골프장 예약 OBA', true, '2026-07-10 17:28:57.239277+09', '2026-07-10 17:28:57.239277+09');


ALTER TABLE public.roles ENABLE TRIGGER ALL;

--
-- Data for Name: partners; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.partners DISABLE TRIGGER ALL;

INSERT INTO public.partners (id, company_name, manager_name, email, phone, purpose, status, reject_reason, partner_code, processed_at, created_at, role_id) VALUES (4, '(주)거꾸로해도윤태윤', '윤태윤', 'yoonyoon@hanwha.com', '010-0000-9999', '내가 대표요. 내가 왕이될 상이로다', 'pending', NULL, NULL, NULL, '2026-06-26 15:02:15.395149+09', NULL);
INSERT INTO public.partners (id, company_name, manager_name, email, phone, purpose, status, reject_reason, partner_code, processed_at, created_at, role_id) VALUES (2, '저기어때', '김은성', 'silverstar@hanwha.com', '010-1111-2222', '나는 silverstar. goldstar 댐벼보시지', 'rejected', 'silver는 취급 안합니데이', NULL, '2026-06-26 15:02:37.04036+09', '2026-06-26 15:00:50.20055+09', NULL);
INSERT INTO public.partners (id, company_name, manager_name, email, phone, purpose, status, reject_reason, partner_code, processed_at, created_at, role_id) VALUES (1, '야어때', '김주희', 'juhee3160@hanwha.com', '010-5196-3160', '연결해서 돈 마니 벌고 싶어요 안된다구요?', 'approved', NULL, '88007882', '2026-06-26 15:02:26.35423+09', '2026-06-26 15:00:14.357119+09', 2);
INSERT INTO public.partners (id, company_name, manager_name, email, phone, purpose, status, reject_reason, partner_code, processed_at, created_at, role_id) VALUES (3, '천수관컴퍼니', '박승욱', 'beast00k@hanwha.com', '010-3333-4444', '나는 짐승욱. 호랑이 댐벼라', 'approved', NULL, '69249209', '2026-06-26 15:02:40.954274+09', '2026-06-26 15:01:22.777571+09', 3);


ALTER TABLE public.partners ENABLE TRIGGER ALL;

--
-- Data for Name: firewall_requests; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.firewall_requests DISABLE TRIGGER ALL;



ALTER TABLE public.firewall_requests ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users (id, username, password_hash, name, role, partner_id, created_at) VALUES (1, 'admin', '$2b$10$3HrMYoyL5qKWvOtcUz0urORp3I2cU/gPvcjUK2mpLZIYNkUtLRduS', '깅밍굥', 'admin', NULL, '2026-06-26 14:29:55.406891+09');
INSERT INTO public.users (id, username, password_hash, name, role, partner_id, created_at) VALUES (2, '88007882', '$2b$10$BR9V1nSrLnkNelk16NSIduzJsDb.xwj2tekO9J1TT20KKcCYfZMTC', '김주희', 'BigCorp', 1, '2026-06-26 15:02:26.409873+09');
INSERT INTO public.users (id, username, password_hash, name, role, partner_id, created_at) VALUES (3, '69249209', '$2b$10$8.pDioENqaMbBbYe5n63g.TUsfjQSKqQBnytXZQMhA0OPEr7HRLQq', '박승욱', 'BigCorp', 3, '2026-06-26 15:02:41.012472+09');


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- Data for Name: inquiries; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.inquiries DISABLE TRIGGER ALL;

INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (5, 2, '이22222222 문희는 답변을 대기하도록 하겠습니다', NULL, 'pending', false, NULL, '2026-06-26 15:03:18.834454+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (4, 2, '아...문희가 있습니다
가문희
나문희 다문희!!!!!!!!!!!!!!!!!!', '라문희입니다.', 'answered', true, '2026-06-26 15:07:46.212941+09', '2026-06-26 15:03:05.87829+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (6, 3, '나도 문의가 있는데요~
이렇게 쓰면
되는 건지 궁금하기도
하고 안궁금함', NULL, 'pending', false, NULL, '2026-06-26 15:33:08.761811+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (1, 1, '콘도예약 API 호출 시 401 오류가 발생합니다', '토큰 만료 여부를 확인하고 재발급 신청해주세요.', 'answered', false, NULL, '2026-06-26 14:29:27.106078+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (2, 1, '방화벽 해제 처리 기간은 얼마나 걸리나요?', '신청 후 1~2 영업일 이내 처리됩니다.', 'answered', true, NULL, '2026-06-26 14:29:27.106078+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (3, 1, '골프 예약 API에서 예약 취소 시 환불 처리는 어떻게 되나요?', NULL, 'pending', false, NULL, '2026-06-26 14:29:27.106078+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (7, 1, '나는 관리자입니다', '정중히 신청해야 받아줍니다
?
??

???
????

ㅇㅇ', 'answered', true, '2026-06-26 15:35:30.117953+09', '2026-06-26 15:35:12.139492+09');
INSERT INTO public.inquiries (id, user_id, question, answer, status, is_faq, answered_at, created_at) VALUES (8, 1, '문의 추가 테스트', '입니다', 'answered', true, '2026-06-26 15:53:54.929208+09', '2026-06-26 15:53:54.929208+09');


ALTER TABLE public.inquiries ENABLE TRIGGER ALL;

--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.menus DISABLE TRIGGER ALL;

INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (3, NULL, 'API', '/api-reference', 'nav', NULL, false, 3, true, '2026-07-10 16:35:33.078604+09', '2026-07-10 16:35:33.078604+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (4, NULL, '운영 지원', '/support', 'nav', NULL, false, 4, true, '2026-07-10 16:35:33.078604+09', '2026-07-10 16:35:33.078604+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (5, NULL, '관리자', '/admin', 'nav', NULL, true, 5, true, '2026-07-10 16:35:33.078604+09', '2026-07-10 16:35:33.078604+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (6, 5, '파트너사 코드 신청', '/admin/partners', 'admin-tab', '👤', true, 1, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (7, 5, '방화벽·토큰 요청', '/admin/firewall', 'admin-tab', '🔓', true, 2, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (8, 5, '문의 확인', '/admin/inquiries', 'admin-tab', '💬', true, 3, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (9, 5, '공지사항 관리', '/admin/notices', 'admin-tab', '📢', true, 4, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (10, 5, 'API 등록/관리', '/admin/apis', 'admin-tab', '🧩', true, 5, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (11, 5, '메뉴 관리', '/admin/menus', 'admin-tab', '🗂', true, 6, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (13, 3, '공통', NULL, 'group', NULL, false, 10, true, '2026-07-10 16:35:33.088543+09', '2026-07-10 16:35:33.088543+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (14, 3, '리조트', NULL, 'group', NULL, false, 20, true, '2026-07-10 16:35:33.088543+09', '2026-07-10 16:35:33.088543+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (15, 3, '에스테이트', NULL, 'group', NULL, false, 30, true, '2026-07-10 16:35:33.088543+09', '2026-07-10 16:35:33.088543+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (16, 13, '헤더', '/api-reference?doc=header', 'api-doc', NULL, false, 11, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.203112+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (17, 13, '인증', '/api-reference?doc=auth', 'api-doc', NULL, false, 12, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.203112+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (18, 13, '에러 코드', '/api-reference?doc=error-codes', 'api-doc', NULL, false, 13, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.203112+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (19, 14, '대형법인사', '/api-reference?doc=condo', 'api-doc', NULL, false, 21, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.207767+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (20, 14, '골프장 키오스크', '/api-reference?doc=golf', 'api-doc', NULL, false, 22, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.207767+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (21, 14, '상품/쿠폰', '/api-reference?doc=product', 'api-doc', NULL, false, 23, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.207767+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (22, 14, 'H-LIVE포인트', '/api-reference?doc=hlive', 'api-doc', NULL, false, 24, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.207767+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (23, 15, '부대시설', '/api-reference?doc=estate-facility', 'api-doc', NULL, false, 31, true, '2026-07-10 16:35:33.090416+09', '2026-07-10 16:35:33.208936+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (12, 5, '권한 그룹 관리', '/admin/roles', 'admin-tab', '🔑', true, 7, true, '2026-07-10 16:35:33.081022+09', '2026-07-10 16:35:33.081022+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (2, NULL, '시작하기', '/guide', 'nav', NULL, false, 2, true, '2026-07-10 16:35:33.078604+09', '2026-07-10 16:56:12.273237+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (1, NULL, 'HOME', '/home', 'nav', NULL, false, 1, true, '2026-07-10 16:35:33.078604+09', '2026-07-10 17:12:24.999789+09');
INSERT INTO public.menus (id, parent_id, name, path, menu_type, icon, admin_only, display_order, is_active, created_at, updated_at) VALUES (24, 5, '사용자별 권한관리', '/admin/partner-roles', 'nav', '🧑‍💼', true, 8, true, '2026-07-10 17:25:58.538447+09', '2026-07-10 17:25:58.538447+09');


ALTER TABLE public.menus ENABLE TRIGGER ALL;

--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.notices DISABLE TRIGGER ALL;

INSERT INTO public.notices (id, tag, tag_type, title, content, is_visible, created_at) VALUES (1, '공지 NEW', 'new', '[필독] API 인증 방식 변경 안내 (Bearer Token)', NULL, true, '2025-08-01 09:00:00+09');
INSERT INTO public.notices (id, tag, tag_type, title, content, is_visible, created_at) VALUES (2, '공지', 'notice', '스테이징 서버 점검 일정 안내 (8/15 02:00~06:00)', NULL, true, '2025-07-28 09:00:00+09');
INSERT INTO public.notices (id, tag, tag_type, title, content, is_visible, created_at) VALUES (3, '업데이트', 'update', '콘도예약 API v2.1 배포 안내 – 파라미터 추가', NULL, true, '2025-07-20 09:00:00+09');
INSERT INTO public.notices (id, tag, tag_type, title, content, is_visible, created_at) VALUES (4, '공지', 'notice', '추석 연휴 운영 안내 (9/15~9/17 긴급 대응팀 운영)', NULL, true, '2025-07-10 09:00:00+09');


ALTER TABLE public.notices ENABLE TRIGGER ALL;

--
-- Data for Name: partner_firewall_applies; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.partner_firewall_applies DISABLE TRIGGER ALL;

INSERT INTO public.partner_firewall_applies (id, user_id, source_ip, source_hostname, dest_ip, dest_hostname, approval_status, reject_reason, note, requested_at, approved_at, dest_port, token) VALUES (3, 2, '222.222.222.222', 'http://serverreal.monkey.com', '211.197.235.53', 'exgate.hanwharesort.co.kr', 'pending', NULL, '운영 뚤허서 마비시킨다잉', '2026-06-26 15:06:54.889994+09', NULL, '443', NULL);
INSERT INTO public.partner_firewall_applies (id, user_id, source_ip, source_hostname, dest_ip, dest_hostname, approval_status, reject_reason, note, requested_at, approved_at, dest_port, token) VALUES (1, 2, '111.111.111.111', 'http://server.monkey.com', '211.197.235.21', 'exgatedev.hanwharesort.co.kr', 'rejected', '너무 예의가 없네요', 'ㅋㅋㅋㅋㅋ컄ㅋㅋ 방화벽 뚫려라잉~~~!!!', '2026-06-26 15:06:19.997523+09', '2026-06-26 15:07:13.59113+09', '80', NULL);
INSERT INTO public.partner_firewall_applies (id, user_id, source_ip, source_hostname, dest_ip, dest_hostname, approval_status, reject_reason, note, requested_at, approved_at, dest_port, token) VALUES (2, 2, '111.111.111.222', 'http://server.monkey.com', '211.197.235.21', 'exgatedev.hanwharesort.co.kr', 'approved', NULL, '죄송합니다 예의있게 다시 신청하겠습니다', '2026-06-26 15:06:35.50431+09', '2026-06-26 15:07:16.254632+09', '80', 'HWR41306337');
INSERT INTO public.partner_firewall_applies (id, user_id, source_ip, source_hostname, dest_ip, dest_hostname, approval_status, reject_reason, note, requested_at, approved_at, dest_port, token) VALUES (4, 3, '999.888.777.666', 'https://iamking.api.com', '211.197.235.21', 'exgatedev.hanwharesort.co.kr', 'pending', NULL, '나는 정중히 신청하는
왕입니다용
갈히', '2026-06-26 15:34:44.985276+09', NULL, '80', NULL);


ALTER TABLE public.partner_firewall_applies ENABLE TRIGGER ALL;

--
-- Data for Name: role_menus; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.role_menus DISABLE TRIGGER ALL;

INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 1);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 2);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 3);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 4);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 5);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 6);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 7);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 8);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 9);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 10);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 11);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 12);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 13);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 14);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 15);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 16);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 17);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 18);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 19);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 20);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 21);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 22);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 23);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 1);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 2);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 3);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 13);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 16);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 17);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 18);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 14);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 19);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 20);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 15);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (2, 4);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (1, 24);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 1);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 2);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 3);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 14);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 20);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 21);
INSERT INTO public.role_menus (role_id, menu_id) VALUES (3, 4);


ALTER TABLE public.role_menus ENABLE TRIGGER ALL;

--
-- Name: api_specs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.api_specs_id_seq', 1, true);


--
-- Name: firewall_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.firewall_requests_id_seq', 1, false);


--
-- Name: inquiries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inquiries_id_seq', 8, true);


--
-- Name: menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menus_id_seq', 24, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notices_id_seq', 4, true);


--
-- Name: partner_firewall_applies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partner_firewall_applies_id_seq', 4, true);


--
-- Name: partners_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.partners_id_seq', 4, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 4, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--


