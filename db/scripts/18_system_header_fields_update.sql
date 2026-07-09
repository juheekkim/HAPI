-- 18_system_header_fields_update.sql
-- 시스템공통헤더(SystemHeader) 데이터 전체 교체
-- 17_header_fields_table.sql에 들어간 시스템공통헤더 placeholder 4건(sysId/channelId/envDiv/traceId)을 삭제하고
-- 실제 표준전문 스펙 29건(9개 구분 그룹)으로 대체한다.

DELETE FROM header_fields WHERE section = 'system';

-- 구분 없음
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', NULL, '표준전문길이', 'STD_TMSG_LEN', '숫자', 8, 0, '△', NULL, '△', '(전체전문길이 - 8) Byte : JSON 생략', 'none', NULL, 1);

-- 표준전문 기본정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '표준전문 기본정보', '전문버전구분코드', 'TMSG_VER_DV_CD', '문자', 2, 8, '○', NULL, '●', '표준전문의 버젼을 기입한다.
EX) 01, 02', 'fix', '01', 2),
('system', '표준전문 기본정보', '환경정보구분코드', 'ENVR_INFO_DV_CD', '문자', 1, 10, '○', NULL, '●', '해당 전문의 요청 시스템의 환경
L(로컬) / D(개발) / R(운영)', 'variable', NULL, 3),
('system', '표준전문 기본정보', '표준전문암호화구분코드', 'STN_MSG_ENCP_CD', '문자', 1, 11, '○', NULL, '●', '해당 전문의 암호화 여부 및 방식에 대한 정의
Default 0 : 암호화 사용안함', 'fix', '0', 4),
('system', '표준전문 기본정보', '표준전문압축구분코드', 'STN_MSG_COMP_CD', '문자', 1, 12, '○', NULL, '●', '해당 전문의 압축 여부 및 방식에 대한 정의
Default 0 : 압축 사용안함', 'fix', '0', 5),
('system', '표준전문 기본정보', '언어구분코드', 'LANG_CD', '문자', 2, 13, '○', NULL, '●', '단말기기의 언어구분, 메시지부 변환시에 사용
KO(한국어), EN(영어), JP(일본어), ZH(중국어/번체), CN(중국어/간체)', 'fix', 'KO', 6);

-- 표준전문 글로벌ID
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '표준전문 글로벌ID', '표준전문작성일자', 'TMSG_WRTG_DT', '문자', 8, 15, '○', NULL, '●', '전문작성일 (YYYYMMDD)', 'variable', NULL, 7),
('system', '표준전문 글로벌ID', '표준전문생성시스템명', 'TMSG_CRE_SYS_NM', '문자', 8, 23, '○', NULL, '●', '시스템 구분코드(3) + 일련번호(5)
- 시스템 구분코드 : 메타에 등록된 시스템명
- 일련번호 : Random(5)', 'variable', 'LCB + Random(5)', 8),
('system', '표준전문 글로벌ID', '표준전문일련번호', 'STD_TMSG_SEQ_NO', '문자', 14, 31, '○', NULL, '●', '전문발생시마다 채번을 하며, 중복이 되어서는 안됨
Random(1) + unix time(13)', 'variable', 'Random(1) + unix time(13)', 9),
('system', '표준전문 글로벌ID', '표준전문진행번호', 'STD_TMSG_PRGR_NO', '숫자', 2, 45, '○', NULL, '●', '여러 노드를 거치는 과정의 GID Trace를 하기 위함 (''00'' 고정)', 'fix', '00', 10);

-- 요청시스템정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '요청시스템정보', '표준전문요청IP주소', 'STN_TMSG_IP', '문자', 39, 47, '○', NULL, '●', 'XXX.XXX.XXX.XXX(IP v4)
EX) 172.16.100.23
주) 온라인거래로그에서 별도 사용(필드명 변경시 고려)', 'variable', NULL, 11),
('system', '요청시스템정보', '표준전문요청MAC주소', 'STN_TMSG_MAC', '문자', 17, 86, '○', NULL, '●', '00-00-00-00-00-00 (- 포함)
- 통합UI(Nexacro) 필수 항목
- MCI PUSH를 사용하는 채널은 필수 항목', 'variable', NULL, 12),
('system', '요청시스템정보', '최초요청시스템코드', 'FRS_RQST_SYS_CD', '문자', 3, 103, '○', NULL, '●', '메타에 등록된 시스템코드', 'fix', 'LCB', 13),
('system', '요청시스템정보', '최초요청일시', 'FRS_RQST_DTM', '문자', 17, 106, '○', NULL, '●', 'YYYYMMDDHHMMSSTTT (년-월-일-시-분-초-1/1000초)', 'variable', NULL, 14);

-- 표준전문 송신정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '표준전문 송신정보', '송신시스템코드', 'TRMS_SYS_CD', '문자', 3, 123, '○', '○', '○', '전문 송신시 해당 노드의 시스템 코드를 세팅하며 노드변경마다 해당 시스템 코드로 세팅', 'fix', 'LCB', 15),
('system', '표준전문 송신정보', '송신노드번호', 'TRMS_ND_NO', '숫자', 8, 126, '△', '○', '△', '다수의 시스템/혹은 노드로 구성되었을 때에 해당 시스템 노드 정보, 응답시에는 불변,
필요시 설정 가능 (통합UI에서는 빈값)', 'none', NULL, 16),
('system', '표준전문 송신정보', '요청응답구분코드', 'RQST_RSPS_DV_CD', '문자', 1, 134, '○', NULL, '○', '요청전문인지 응답전문인지의 구분 (''S'':요청 , ''R'':응답)', 'fix', 'S', 17),
('system', '표준전문 송신정보', '업무동기화구분코드', 'TRSC_SYNC_DV_CD', '문자', 1, 135, '○', NULL, '●', '업무 요청후 응답을 대기하는 방식에 따른 구분(''S'':동기(Sync) ,''A'':비동기(Async))', 'fix', 'S', 18),
('system', '표준전문 송신정보', '표준전문송신일시', 'TMSG_RQST_DTM', '문자', 17, 136, '○', NULL, '○', '전문 송신시 해당 노드의 송신시각을 설정하며 노드 변경시마다 송신시각을 다시 설정
YYYYMMDDHHMMSSTTT (년-월-일-시-분-초-1/1000초) Format', 'variable', NULL, 19);

-- 표준전문 라우팅정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '표준전문 라우팅정보', '수신서비스코드(거래코드)', 'RECV_SVC_CD', '문자', 13, 153, '△', NULL, '▲', '수신 시스템에서 불려질 실제적인 최종 서비스코드
제공시스템(3)+업무대분류(3)+업무중분류(3)+일련번호(4)', 'variable', 'HBSREMPRR9901 : 예약요청
HBSREMPRR9902 : 예약취소
HBSREMPRR9903 : 예약조회
HBSREMPRR9904 : 예약수정
HBSREMPRR9905 : 캐파조회', 20),
('system', '표준전문 라우팅정보', '인터페이스ID', 'INTF_ID', '문자', 18, 166, '○', NULL, '●', 'MCI/EAI 호출을 위한 인터페이스 ID
요청시스템(3)+일련번호(2)+서비스코드(13)', 'variable', 'LCB00HBSREMPRR9901 : 예약요청
LCB00HBSREMPRR9902 : 예약취소
LCB00HBSREMPRR9903 : 예약조회
LCB00HBSREMPRR9904 : 예약수정
LCB00HBSREMPRR9905 : 캐파조회', 21);

-- 표준전문 응답정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '표준전문 응답정보', '응답전문 발생 시각', 'TMSG_RSPS_DTM', '문자', 17, 184, '×', NULL, '○', '응답전문 발생시점의 시각, 응답전문을 생성하는 시스템에서 셋팅하며,
응답전문시 매번 리턴하기 전에 Update하고 Logging 처리함
YYYYMMDDHHMMSSTTT (년-월-일-시-분-초-1/1000초) Format', 'none', NULL, 22),
('system', '표준전문 응답정보', '처리결과구분코드', 'PRCS_RSLT_CD', '문자', 1, 201, '×', NULL, '○', '응답 전문의 처리 결과 오류 구분
''0''=정상 , ''1''=시스템오류 (시스템오류 발생시 메시지부의 ''메세지정상처리여부''에 -1 설정)', 'none', NULL, 23),
('system', '표준전문 응답정보', '오류발생시스템코드', 'ERR_OCC_SYS_CD', '문자', 3, 202, '×', NULL, '△', '응답 전문의 오류발생 시 시스템 코드
메타에 등록된 시스템 코드', 'none', NULL, 24),
('system', '표준전문 응답정보', '표준전문오류코드', 'STN_TMSG_ERR_CD', '문자', 9, 205, '×', NULL, '△', '최초 오류 발생시 대표 오류 메시지코드를 설정
오류유형코드 포맷 미정(프로젝트에서 결정 후 수정)', 'none', NULL, 25);

-- MCI정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', 'MCI정보', 'MCI노드번호', 'MCI_NODE_NO', '문자', 8, 214, '△', NULL, '▲', 'MCI에서 송신시 노드 정보 설정
( IGATE + MCI노드ID(1) + MCI서버ID(1) )', 'none', NULL, 26),
('system', 'MCI정보', '리모트IP주소', 'REMT_IP', '문자', 24, 222, '△', NULL, '▲', 'MCI에서 확인되는 통합UI의 IP주소', 'none', NULL, 27),
('system', 'MCI정보', 'MCI세션ID', 'MCI_SSN_ID', '문자', 8, 246, '△', NULL, '▲', '통합UI에서 MCI 로그인 업무시 발급받은 세션ID를 셋팅', 'none', NULL, 28);

-- 여유
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', '여유', 'FILLER', 'FILLER', '문자', 6, 254, '×', NULL, '×', '시스템 확장을 위한 여유자리', 'none', NULL, 29);
