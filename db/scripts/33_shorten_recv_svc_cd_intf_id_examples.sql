-- 33_shorten_recv_svc_cd_intf_id_examples.sql
-- header_fields.RECV_SVC_CD/INTF_ID(둘 다 setting_type='variable')의 setting_value에 실제 서비스코드
-- 5개(예약요청/취소/조회/수정/캐파조회)가 전부 나열돼 있어 API Reference 헤더정보 표(표준전문
-- 라우팅정보)에서 예시가 과도하게 길게 보였다. 이 값들은 필수 입력값의 "실제 가능한 전체 목록"이
-- 아니라 형식을 보여주는 예시일 뿐이므로, 대표 예시 1개 + "등"으로 줄인다.
-- 실행 순서: 33번(17 이후 아무 때나). 멱등(값으로 명시 매칭).
SET client_encoding TO 'UTF8';

UPDATE header_fields
SET setting_value = 'HBSREMPRR9901 : 예약요청 등'
WHERE field_name_en = 'RECV_SVC_CD'
  AND setting_value = 'HBSREMPRR9901 : 예약요청
HBSREMPRR9902 : 예약취소
HBSREMPRR9903 : 예약조회
HBSREMPRR9904 : 예약수정
HBSREMPRR9905 : 캐파조회';

UPDATE header_fields
SET setting_value = 'LCB00HBSREMPRR9901 : 예약요청 등'
WHERE field_name_en = 'INTF_ID'
  AND setting_value = 'LCB00HBSREMPRR9901 : 예약요청
LCB00HBSREMPRR9902 : 예약취소
LCB00HBSREMPRR9903 : 예약조회
LCB00HBSREMPRR9904 : 예약수정
LCB00HBSREMPRR9905 : 캐파조회';
