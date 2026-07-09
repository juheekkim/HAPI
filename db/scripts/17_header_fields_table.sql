-- 17_header_fields_table.sql
-- 헤더 정보 관리 테이블 생성 및 데이터 삽입
-- 시스템공통헤더, 거래공통헤더, 메시지헤더 정보 저장

CREATE TABLE header_fields (
  id SERIAL PRIMARY KEY,
  section VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  field_name_ko VARCHAR(100) NOT NULL,
  field_name_en VARCHAR(100) NOT NULL,
  item_type VARCHAR(20),
  length INT,
  field_offset INT,
  required_request CHAR(1),
  required_mci CHAR(1),
  required_response CHAR(1),
  description TEXT,
  setting_type VARCHAR(50),
  setting_value VARCHAR(255),
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_header_fields_section ON header_fields(section);
CREATE INDEX idx_header_fields_category ON header_fields(category);

-- 시스템공통헤더 (SystemHeader) 데이터
INSERT INTO header_fields (section, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('system', 'sysId', 'sysId', '문자', 10, 0, 'Y', 'Y', 'Y', '시스템 ID (한화리조트에서 발급)', 'none', NULL, 1),
('system', 'channelId', 'channelId', '문자', 10, 0, 'Y', 'Y', 'Y', '채널 ID', 'none', NULL, 2),
('system', 'envDiv', 'envDiv', '문자', 1, 0, 'Y', 'Y', 'Y', '환경 구분 (D: 개발, P: 운영)', 'none', NULL, 3),
('system', 'traceId', 'traceId', '문자', 36, 0, 'N', 'Y', 'Y', '트레이스 ID (UUID 형식, 로그 추적용)', 'none', NULL, 4);

-- 거래공통헤더 (TransactionHeader) - 거래공통 데이터
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '거래공통', '표준전문거래유형코드', 'STN_MSG_TR_TP_CD', '문자', 1, 0, 'Y', '●', 'Y', '통신유형에 따른 구분코드, default ''O'' / O: 온라인', 'fix', 'O', 1),
('transaction', '거래공통', '시스템타입', 'SYSTEM_TYPE', '문자', 8, 1, 'Y', '●', 'Y', '시스템타입 / 리조트FO차세대의 경우 ''HABIS''', 'fix', 'HABIS', 2),
('transaction', '거래공통', '화면단축번호', 'SCREEN_SHORTEN_NO', '문자', 5, 9, 'Y', '▲', 'Y', '화면호출단축번호', 'none', NULL, 3),
('transaction', '거래공통', '화면ID', 'SCREEN_ID', '문자', 13, 14, 'Y', '●', 'Y', '화면ID / 대분류(3)+중분류(3)+일련번호(4)+화면구분(1)+일련번호(2)', 'none', NULL, 4);

-- 거래공통헤더 (TransactionHeader) - 사용자정보 데이터
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '사용자정보', '법인코드', 'CORP_CD', '문자', 4, 27, 'Y', '●', 'Y', '사용자의 법인코드 (전사 코드 참조)', 'fix', '1000', 5),
('transaction', '사용자정보', '회사코드', 'CMP_NO', '문자', 4, 31, 'Y', '●', 'Y', '사용자의 회사코드 (전사 코드 참조)', 'none', NULL, 6),
('transaction', '사용자정보', '사업장코드', 'BRANCH_NO', '문자', 4, 35, 'Y', '●', 'Y', '사용자의 사업장 코드 (전사 코드 참조)', 'none', NULL, 7),
('transaction', '사용자정보', '영업장코드', 'LOC_CD', '문자', 4, 39, 'Y', '●', 'Y', '사용자의 영업장 코드 (전사 코드 참조)', 'none', NULL, 8),
('transaction', '사용자정보', '사용자번호', 'WRKR_NO', '문자', 20, 43, 'Y', '●', 'Y', '사용자의 직원번호', 'fix', 'l1711019', 9),
('transaction', '사용자정보', '개인정보 마스킹 여부', 'PERS_INFO_MASK', '문자', 20, 63, 'Y', '●', 'Y', '사용자의 개인정보 마스킹 여부', 'none', NULL, 10),
('transaction', '사용자정보', '마스크권한', 'MASK_AUTH', '문자', 1, 83, 'Y', '●', 'Y', '사용자의 개인정보 동의여부', 'fix', '0', 11);

-- 거래공통헤더 (TransactionHeader) - 대외공통 데이터
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('transaction', '대외공통', '대외거래구분코드', 'OSDE_TR_CD', '문자', 1, 84, 'Y', '▲', 'Y', '대외 거래의 종류를 구분하기 위한 코드 / ''O''=온라인, ''B''=배치', 'none', NULL, 12),
('transaction', '대외공통', '대외거래기관구분코드', 'OSDE_TR_ORG_CD', '문자', 6, 85, 'Y', '▲', 'Y', '대외 거래의 기관을 구분하기 위한 코드', 'none', NULL, 13),
('transaction', '대외공통', '대외거래전문종별구분코드', 'OSDE_TR_MSG_CD', '문자', 4, 91, 'Y', '▲', 'Y', '대외 거래 전문의 종류를 구분하기 위한 코드', 'none', NULL, 14),
('transaction', '대외공통', '대외거래업무구분코드', 'OSDE_TR_JOB_CD', '문자', 3, 95, 'Y', '▲', 'Y', '대외 거래의 업무를 구분하기 위한 코드', 'none', NULL, 15),
('transaction', '대외공통', '대외거래라우팅ID', 'OSDE_TR_RUTN_ID', '문자', 12, 98, 'Y', '▲', 'Y', '대외 요청에 대한 기관 라우팅 정보', 'none', NULL, 16),
('transaction', '대외공통', '대외거래일련번호', 'OSDE_TR_PRG_NO', '숫자', 8, 110, 'Y', '▲', 'Y', '대외 거래 전문의 일련번호', 'none', NULL, 17),
('transaction', '여유', 'FILLER', 'FILLER', '문자', 9, 118, 'Y', '×', 'Y', '시스템 확장을 위한 여유자리', 'none', NULL, 18);

-- 메시지헤더 (MessageHeader) 데이터
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('message', '메시지데이터부', '메시지 정상 처리 여부', 'MSG_PRCS_RSLT_CD', '문자', 2, 0, 'Y', '△', 'Y', '에러코드 블랙 오류코드 / 정상 0, 오류 -1', 'none', NULL, 1),
('message', '메시지데이터부', '메시지 데이터부 반복횟수', 'MSG_DATA_SUB_RPTT_CNT', '숫자', 1, 2, 'Y', '△', 'Y', '메시지부 반복횟수 / 메시지가 없을 경우 ''0''', 'none', NULL, 2),
('message', '메시지데이터부', '메시지표시구분코드', 'MSG_INDC_CD', '문자', 4, 3, 'Y', '△', 'Y', '메시지 표시 방법 / ''0'': 일반 메시지 창 출력 (정상/에러 메시지창) DEFAULT / ''1'': 거래 상태바에만 출력 / ''9'': 메시지 창 출력 안함', 'none', NULL, 3),
('message', '메시지데이터부', '메시지코드', 'MSG_CD', '문자', 12, 7, 'Y', '△', 'Y', '메시지 코드 체계에 따르며 메시지 내용이 200바이트 이상일 경우 동일 메시지 코드를 지정하며 메시지 내용은 분할 삽입', 'none', NULL, 4),
('message', '메시지데이터부', '메시지내용', 'MSG_CTNS', '문자', 400, 19, 'Y', '△', 'Y', '주메시지 내용', 'none', NULL, 5);
