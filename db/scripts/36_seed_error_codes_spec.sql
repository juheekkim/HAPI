-- 36_seed_error_codes_spec.sql
-- API Reference "공통 > 에러 코드" 메뉴(menus.id=18, path=/api-reference?doc=error-codes)가 가리키는
-- api_specs 행이 없어(STATIC_SPECS는 DB에 행이 1개라도 있으면 아예 쓰이지 않음, apiSpecModel.getAll()
-- 참고) 화면이 비어 있었다. 실제 운영에서 쓰이는 응답 메시지 코드(MessageHeader.MSG_DATA_SUB[].MSG_CD/
-- MSG_CTNS, business-rules.md §10) 참고표로 채운다. error_codes 필드 형태를 기존 STATIC_SPECS의
-- REST HTTP 코드 예시({code,http,desc})에서 실제 쓰이는 {code,name,desc}(메시지코드/메시지명/설명)로
-- 바꿨다 — 화면(index.ejs)도 함께 갱신.
-- 관리자 API 등록 화면(api-form.ejs)은 아직 error_codes 편집을 지원하지 않아, 시스템 정보(32)와
-- 같은 방식으로 db/scripts INSERT로 등록한다. 추가 코드는 확인되는 대로 새 번호 스크립트로 append.
-- 실행 순서: 36번(01 이후 아무 때나). 멱등(domain UNIQUE 제약, 존재 시 skip).
SET client_encoding TO 'UTF8';

INSERT INTO api_specs (category, domain, name, description, endpoints, error_codes, display_order)
SELECT
  'common',
  'error-codes',
  '에러 코드',
  '공통으로 발생하는 응답 메시지 코드(MessageHeader.MSG_DATA_SUB[].MSG_CD/MSG_CTNS)와 설명입니다.',
  '[]'::jsonb,
  '[
    {"code": "REME000057", "name": "고객번호가 없습니다.", "desc": "입력 값에 고객번호(CUST_NO)가 없을 경우"},
    {"code": "REME000156", "name": "영업장코드가 없습니다.", "desc": "입력 값에 영업장(LOC_CD)가 없을 경우"},
    {"code": "REME000153", "name": "도착일자가 없습니다.", "desc": "입력 값에 도착일자(ARRV_DATE)가 없을 경우"},
    {"code": "REME000299", "name": "박수가 없습니다.", "desc": "입력 값에 박수(OVNT_CNT)가 없을 경우"},
    {"code": "REME000158", "name": "예약객실수가 없습니다.", "desc": "입력 값에 예약객실수(RSRV_ROOM_CNT)가 없을 경우"},
    {"code": "REME000313", "name": "사용자명이 없습니다.", "desc": "입력 값에 사용자명(INHS_CUST_NM)이 없을 경우"},
    {"code": "REME000314", "name": "사용자 전화번호가 없습니다.", "desc": "입력 값에 사용자전화번호(INHS_CUST_TEL_NO2,3,4)가 없을 경우"},
    {"code": "REME000315", "name": "예약자명이 없습니다.", "desc": "입력 값에 예약자명(RSRV_CUST_NM)이 없을 경우"},
    {"code": "REME000316", "name": "예약자 전화번호가 없습니다.", "desc": "입력 값에 예약자전화번호(RSRV_CUST_TEL_NO2,3,4)가 없을 경우"},
    {"code": "REME000317", "name": "도착일자 형식에 오류가 있거나 없는 일자입니다. (YYYYMMDD)", "desc": "도착일자 형이에 오류가 있거나 실제로 없는 일자값일 경우"},
    {"code": "REME000103", "name": "도착일자를 영업일자 이전으로 입력할 수 없습니다.", "desc": "도착일자가 과거일 경우"},
    {"code": "REME000115", "name": "등록된 영업장이 아닙니다.", "desc": "영업장 코드가 등록되어 있지 않을 경우"},
    {"code": "REME000127", "name": "등록된 고객 정보가 없습니다.", "desc": "고객번호가 등록되어 있지 않을 경우"},
    {"code": "REME000125", "name": "등록된 회원마스터 정보가 없습니다.", "desc": "회원마스터번호가 등록되어 있지 않을 경우"},
    {"code": "REME000124", "name": "등록된 계약 정보가 없습니다.", "desc": "계약번호가 등록되어 있지 않을 경우"},
    {"code": "REME000182", "name": "잔여객실이 부족하여 예약하실 수 없습니다.", "desc": "잔여 객실이 없을 경우"},
    {"code": "REME000072", "name": "처리 중 오류가 발생하였습니다.", "desc": "그외 기타 시스템 오류"},
    {"code": "REME000191", "name": "최적회원번호가 없습니다.", "desc": "최적 회원번호를 찾지 못했을 경우 (이용권 부족)"},
    {"code": "REME000243", "name": "예약번호가 없습니다.", "desc": "입력 값에 예약번호(RSRV_NO)가 없을 경우"},
    {"code": "REME000246", "name": "예약정보가 없습니다.", "desc": "입력된 예약번호로 예약정보를 찾지 못했을 경우"}
  ]'::jsonb,
  0
WHERE NOT EXISTS (SELECT 1 FROM api_specs WHERE domain = 'error-codes');
