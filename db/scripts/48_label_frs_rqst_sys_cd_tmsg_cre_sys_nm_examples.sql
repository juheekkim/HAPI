-- 48_label_frs_rqst_sys_cd_tmsg_cre_sys_nm_examples.sql
-- FRS_RQST_SYS_CD/TMSG_CRE_SYS_NM(setting_type='variable', 31번에서 FRS_RQST_SYS_CD는 fix->variable로
-- 이미 정정됨)의 setting_value가 "LCB"/"LCB + Random(5)"라 고정값으로 오해될 수 있어, 34번에서
-- RECV_SVC_CD/INTF_ID에 적용한 것과 동일하게 앞에 "예: " 라벨을 붙여 형식 예시임을 명확히 한다.
-- 실행 순서: 48번(31, 34 이후). 멱등(값으로 명시 매칭).
SET client_encoding TO 'UTF8';

UPDATE header_fields
SET setting_value = '예: ' || setting_value
WHERE field_name_en IN ('FRS_RQST_SYS_CD', 'TMSG_CRE_SYS_NM')
  AND setting_value NOT LIKE '예: %';
