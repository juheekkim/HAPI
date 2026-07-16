-- 34_label_recv_svc_cd_intf_id_examples.sql
-- RECV_SVC_CD/INTF_ID(setting_type='variable')의 setting_value가 "고정값"으로 오해될 수 있어
-- 앞에 "예:" 라벨을 붙여 형식 예시임을 더 명확히 한다(33번에서 대표 1개+"등"으로 축약한 값에 적용).
-- 실행 순서: 34번(33 이후). 멱등(값으로 명시 매칭).
SET client_encoding TO 'UTF8';

UPDATE header_fields
SET setting_value = '예: ' || setting_value
WHERE field_name_en IN ('RECV_SVC_CD', 'INTF_ID')
  AND setting_value NOT LIKE '예: %';
