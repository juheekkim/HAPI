-- 20_message_header_fields_update.sql
-- 메시지헤더(MessageHeader) 데이터 전체 교체
-- 17_header_fields_table.sql에 들어간 메시지헤더 데이터는 생성주체 컬럼이 잘못 매핑되어 있었다:
--   required_request/required_response에 'Y'를 넣었으나 실제로는 필드별로 다른 기호(×/○/△)를 써야 함.
--   required_mci는 기존에도 올바르게 '△'였음.
-- 아울러 카테고리를 2개 그룹(무분류 2건 + '메시지 데이터부(MSG_DATA_SUB)' 3건)으로 재구성한다.

DELETE FROM header_fields WHERE section = 'message';

-- 구분 없음
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('message', NULL, '메세지 정상 처리 여부', 'MSG_PRCS_RSLT_CD', '문자', 2, 0, '×', '△', '○', '에러코드 콜백 오류코드
정상 0, 오류 -1', 'none', NULL, 1),
('message', NULL, '메시지 데이터부 반복횟수', 'MSG_DATA_SUB_RPTT_CNT', '숫자', 1, 2, '×', '△', '△', '메시지부 반복횟수
메시지가 없을 경우 ''0''', 'none', NULL, 2);

-- 메시지 데이터부(MSG_DATA_SUB)
INSERT INTO header_fields (section, category, field_name_ko, field_name_en, item_type, length, field_offset, required_request, required_mci, required_response, description, setting_type, setting_value, display_order)
VALUES
('message', '메시지 데이터부(MSG_DATA_SUB)', '메시지표시구분코드', 'MSG_INDC_CD', '문자', 4, 3, '×', '△', '△', '메시지 표시 방법
''0'' : 일반 메시지 창 출력 (정상/에러 메시지창) DEFAULT
''1'' : 거래 상태바에만 출력 (단말 메시지 창 출력 안함)
''9'' : 메시지 창 출력 안함', 'none', NULL, 3),
('message', '메시지 데이터부(MSG_DATA_SUB)', '메시지코드', 'MSG_CD', '문자', 12, 7, '×', '△', '△', '메시지 코드 체계에 따르며 메시지 내용이 200바이트 이상일 경우 동일 메시지 코드를 지정하며 메시지 내용은 분할 삽입.', 'none', NULL, 4),
('message', '메시지 데이터부(MSG_DATA_SUB)', '메시지내용', 'MSG_CTNS', '문자', 400, 19, '×', '△', '△', '주메시지 내용', 'none', NULL, 5);
