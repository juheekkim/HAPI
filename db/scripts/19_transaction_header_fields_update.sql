-- 19_transaction_header_fields_update.sql
-- 거래공통헤더(TransactionHeader) 데이터 전체 교체
-- 17_header_fields_table.sql에 들어간 거래공통헤더 데이터는 생성주체 컬럼이 잘못 매핑되어 있었다:
--   required_request에 'Y', required_response에 'Y'를 넣고 실제 생성주체 기호(●/▲/×)는 required_mci에 넣었음.
-- 올바른 생성주체 기호를 required_request/required_response에 넣고 required_mci는 NULL로 교체한다(거래공통헤더는 MCI 칸을 쓰지 않음).

DELETE FROM header_fields WHERE section = 'transaction';

-- 거래공통
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '거래공통', '표준전문거래유형코드', 'STN_MSG_TR_TP_CD', '문자', 1, 0, '○', NULL, '●', '통신유형에 따른 구분코드, default 값은 ''O''
- O : 온라인', 'fix', 'O', 1),
('transaction', '거래공통', '시스템타입', 'SYSTEM_TYPE', '문자', 8, 1, '○', NULL, '●', '시스템타입
리조트FO차세대의 경우 ''HABIS''', 'fix', 'HABIS', 2),
('transaction', '거래공통', '화면단축번호', 'SCREEN_SHORTEN_NO', '문자', 5, 9, '△', NULL, '▲', '화면호출단축번호', 'none', NULL, 3),
('transaction', '거래공통', '화면ID', 'SCREEN_ID', '문자', 13, 14, '○', NULL, '●', '화면ID
대분류(3)+중분류(3)+일련번호(4)+화면구분(1)+일련번호(2)', 'none', NULL, 4);

-- 사용자정보
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '사용자정보', '법인코드', 'CORP_CD', '문자', 4, 27, '○', NULL, '●', '사용자의 법인코드 (전사 코드 참조)', 'fix', '1000', 5),
('transaction', '사용자정보', '회사코드', 'CMP_NO', '문자', 4, 31, '○', NULL, '●', '사용자의 회사코드 (전사 코드 참조)', 'none', NULL, 6),
('transaction', '사용자정보', '사업장코드', 'BRANCH_NO', '문자', 4, 35, '○', NULL, '●', '사용자의 사업장 코드 (전사 코드 참조)', 'none', NULL, 7),
('transaction', '사용자정보', '영업장코드', 'LOC_CD', '문자', 4, 39, '○', NULL, '●', '사용자의 영업장 코드 (전사 코드 참조)', 'none', NULL, 8),
('transaction', '사용자정보', '사용자번호', 'WRKR_NO', '문자', 20, 43, '○', NULL, '●', '사용자의 직원번호', 'fix', 'l1711019', 9),
('transaction', '사용자정보', '개인정보 마스킹 여부', 'PERS_INFO_MASK', '문자', 20, 63, '○', NULL, '●', '사용자의 개인정보 마스킹 여부', 'none', NULL, 10),
('transaction', '사용자정보', '마스크권한', 'MASK_AUTH', '문자', 1, 83, '○', NULL, '●', '사용자의 개인정보 동의여부', 'fix', '0', 11);

-- 대외공통
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '대외공통', '대외거래구분코드', 'OSDE_TR_CD', '문자', 1, 84, '△', NULL, '▲', '대외 거래의 종류를 구분하기 위한 코드
''O''=온라인, ''B''=배치', 'none', NULL, 12),
('transaction', '대외공통', '대외거래기관구분코드', 'OSDE_TR_ORG_CD', '문자', 6, 85, '△', NULL, '▲', '대외 거래의 기관을 구분하기 위한 코드
대외계 체계에 따름, 예탁원전문일 경우 예탁원에서 발급받은 코드', 'none', NULL, 13),
('transaction', '대외공통', '대외거래전문종별구분코드', 'OSDE_TR_MSG_CD', '문자', 4, 91, '△', NULL, '▲', '대외 거래 전문의 종류를 구분하기 위한 코드
대외계 체계에 따름', 'none', NULL, 14),
('transaction', '대외공통', '대외거래업무구분코드', 'OSDE_TR_JOB_CD', '문자', 3, 95, '△', NULL, '▲', '대외 거래의 업무를 구분하기 위한 코드
대외계 체계에 따름, 예탁원전문일 경우 통신망 관리정보', 'none', NULL, 15),
('transaction', '대외공통', '대외거래라우팅ID', 'OSDE_TR_RUTN_ID', '문자', 12, 98, '△', NULL, '▲', '대외 요청에 대한 기관 라우팅 정보
대외계 체계에 따름, 예탁원전문일 경우 데이터전문코드(10)+공백(2)', 'none', NULL, 16),
('transaction', '대외공통', '대외거래일련번호', 'OSDE_TR_PRG_NO', '숫자', 8, 110, '△', NULL, '▲', '대외 거래 전문의 일련번호
대외계 체계에 따름.
대외수신 전문의 경우 기관에서 채번한 일련번호 임.
대외기관으로 송신하는 전문의 경우 대외 MCI에서 채번한 일련번호 임.', 'none', NULL, 17);

-- 여유
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '여유', 'FILLER', 'FILLER', '문자', 9, 118, '×', NULL, '×', '시스템 확장을 위한 여유자리', 'none', NULL, 18);
