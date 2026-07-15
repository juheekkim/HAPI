-- 31_mark_frs_rqst_sys_cd_variable.sql
-- 최초요청시스템코드(FRS_RQST_SYS_CD)를 fix='LCB'로 저장해 두었으나, 실제로는 호출하는
-- 서비스/시스템마다 값이 다르다(관측된 실 예시에서 'LCB' 외 'TFO'도 확인됨).
-- API Reference "테스트" 샌드박스가 setting_type='fix'는 자동 채움, 'variable'은 사용자 직접
-- 입력으로 구분해 보여주므로(docs/business-rules.md §10), 이 필드는 variable로 정정한다.
-- setting_value는 그대로 두어 참고용 예시값(LCB)으로 입력창 placeholder 힌트에 쓰인다.
-- 실행 순서: 31번 (17~30 실행 후). 멱등(값으로 명시 매칭). UTF-8 저장.
SET client_encoding TO 'UTF8';

UPDATE header_fields
SET setting_type = 'variable'
WHERE field_name_en = 'FRS_RQST_SYS_CD' AND setting_type = 'fix';
