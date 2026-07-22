-- 44_update_bigcorp_resort_reservation_api.sql
-- 대형법인사 리조트 예약 등록 API의 관리자 수정본을 DB 마이그레이션으로 고정한다.
-- 실행 순서: 44번 (43 실행 후). 같은 서비스 ID 또는 기존 예약 등록 엔드포인트를 교체하므로 재실행 안전.

SET client_encoding TO 'UTF8';

-- 현재 관리자 화면에서 확정한 HBSREMPRR9901 예약 등록 스펙.
-- 기존 HBSREMPRR9901 또는 레거시 POST /api/v1/resort/condo/reserve 중 첫 항목을 교체한다.
WITH target(endpoint) AS (
  VALUES (
    $endpoint$
    {
      "url": "HBSREMPRR9901",
      "method": "POST",
      "params": [
        { "desc": "", "name": "CUST_NO", "type": "String", "label": "고객번호", "required": true },
        { "desc": "", "name": "MEMB_NO", "type": "String", "label": "회원번호", "required": false },
        { "desc": "", "name": "CUST_IDNT_NO", "type": "String", "label": "고객 식별번호", "required": false },
        { "desc": "", "name": "CONT_NO", "type": "String", "label": "계약번호", "required": true },
        { "desc": "", "name": "PAKG_NO", "type": "String", "label": "패키지 번호", "required": false },
        { "desc": "", "name": "CPON_NO", "type": "String", "label": "쿠폰 번호", "required": false },
        { "desc": "", "name": "LOC_CD", "type": "String", "label": "영업장 코드", "required": true },
        { "desc": "", "name": "ROOM_TYPE_CD", "type": "String", "label": "객실 타입 코드", "required": true },
        { "desc": "", "name": "RSRV_LOC_DIV_CD", "type": "String", "label": "S/C", "required": true },
        { "desc": "\"YYYYMMDD\" 형식", "name": "ARRV_DATE", "type": "String", "label": "도착일자", "required": true },
        { "desc": "", "name": "RSRV_ROOM_CNT", "type": "String", "label": "예약 객실 수", "required": true },
        { "desc": "", "name": "OVNT_CNT", "type": "String", "label": "박 수", "required": true },
        { "desc": "", "name": "INHS_CUST_NM", "type": "String", "label": "투숙자명", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO2", "type": "String", "label": "투숙자 연락처2", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO3", "type": "String", "label": "투숙자 연락처3", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO4", "type": "String", "label": "투숙자 연락처4", "required": true },
        { "desc": "", "name": "RSRV_CUST_NM", "type": "String", "label": "예약자명", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO2", "type": "String", "label": "예약자 연락처2", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO3", "type": "String", "label": "예약자 연락처3", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO4", "type": "String", "label": "예약자 연락처4", "required": true },
        { "desc": "", "name": "REFRESH_YN", "type": "String", "label": "리프레쉬 여부", "required": false }
      ],
      "description": "예약 등록",
      "responseExample": "{\"resultCode\":\"0000\",\"resultMsg\":\"예약이 완료되었습니다.\",\"data\":{\"reservationId\":\"RSV-20250801-000123\",\"status\":\"CONFIRMED\"}}"
    }
    $endpoint$::jsonb
  )
), matched AS (
  SELECT
    spec.id,
    (item.ordinality - 1)::integer AS endpoint_index
  FROM api_specs AS spec
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(spec.endpoints, '[]'::jsonb))
    WITH ORDINALITY AS item(value, ordinality)
  WHERE spec.domain = 'condo'
    AND (
      item.value->>'url' = 'HBSREMPRR9901'
      OR (
        item.value->>'url' = '/api/v1/resort/condo/reserve'
        AND item.value->>'method' = 'POST'
      )
    )
  ORDER BY
    CASE WHEN item.value->>'url' = 'HBSREMPRR9901' THEN 0 ELSE 1 END,
    item.ordinality
  LIMIT 1
)
UPDATE api_specs AS spec
SET
  category = 'resort',
  name = '콘도 예약 API',
  description = '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다. (대형법인사용)',
  endpoints = jsonb_set(
    COALESCE(spec.endpoints, '[]'::jsonb),
    ARRAY[matched.endpoint_index::text],
    target.endpoint,
    false
  )
FROM matched
CROSS JOIN target
WHERE spec.id = matched.id;

-- 대상 엔드포인트가 없던 환경에서는 기존 조회/취소 스펙을 보존한 채 예약 등록 스펙을 추가한다.
WITH target(endpoint) AS (
  VALUES (
    $endpoint$
    {
      "url": "HBSREMPRR9901",
      "method": "POST",
      "params": [
        { "desc": "", "name": "CUST_NO", "type": "String", "label": "고객번호", "required": true },
        { "desc": "", "name": "MEMB_NO", "type": "String", "label": "회원번호", "required": false },
        { "desc": "", "name": "CUST_IDNT_NO", "type": "String", "label": "고객 식별번호", "required": false },
        { "desc": "", "name": "CONT_NO", "type": "String", "label": "계약번호", "required": true },
        { "desc": "", "name": "PAKG_NO", "type": "String", "label": "패키지 번호", "required": false },
        { "desc": "", "name": "CPON_NO", "type": "String", "label": "쿠폰 번호", "required": false },
        { "desc": "", "name": "LOC_CD", "type": "String", "label": "영업장 코드", "required": true },
        { "desc": "", "name": "ROOM_TYPE_CD", "type": "String", "label": "객실 타입 코드", "required": true },
        { "desc": "", "name": "RSRV_LOC_DIV_CD", "type": "String", "label": "S/C", "required": true },
        { "desc": "\"YYYYMMDD\" 형식", "name": "ARRV_DATE", "type": "String", "label": "도착일자", "required": true },
        { "desc": "", "name": "RSRV_ROOM_CNT", "type": "String", "label": "예약 객실 수", "required": true },
        { "desc": "", "name": "OVNT_CNT", "type": "String", "label": "박 수", "required": true },
        { "desc": "", "name": "INHS_CUST_NM", "type": "String", "label": "투숙자명", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO2", "type": "String", "label": "투숙자 연락처2", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO3", "type": "String", "label": "투숙자 연락처3", "required": true },
        { "desc": "", "name": "INHS_CUST_TEL_NO4", "type": "String", "label": "투숙자 연락처4", "required": true },
        { "desc": "", "name": "RSRV_CUST_NM", "type": "String", "label": "예약자명", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO2", "type": "String", "label": "예약자 연락처2", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO3", "type": "String", "label": "예약자 연락처3", "required": true },
        { "desc": "", "name": "RSRV_CUST_TEL_NO4", "type": "String", "label": "예약자 연락처4", "required": true },
        { "desc": "", "name": "REFRESH_YN", "type": "String", "label": "리프레쉬 여부", "required": false }
      ],
      "description": "예약 등록",
      "responseExample": "{\"resultCode\":\"0000\",\"resultMsg\":\"예약이 완료되었습니다.\",\"data\":{\"reservationId\":\"RSV-20250801-000123\",\"status\":\"CONFIRMED\"}}"
    }
    $endpoint$::jsonb
  )
)
UPDATE api_specs AS spec
SET
  category = 'resort',
  name = '콘도 예약 API',
  description = '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다. (대형법인사용)',
  endpoints = COALESCE(spec.endpoints, '[]'::jsonb) || jsonb_build_array(target.endpoint)
FROM target
WHERE spec.domain = 'condo'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(spec.endpoints, '[]'::jsonb)) AS item(value)
    WHERE item.value->>'url' = 'HBSREMPRR9901'
  );
