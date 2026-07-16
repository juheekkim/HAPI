-- 37_add_error_codes_batch2.sql
-- "공통 > 에러 코드"(`36`) 목록에 신규 확인된 메시지 코드 5건 추가.
-- code 기준으로 이미 존재하는 항목은 제외하고 append(멱등, 여러 번 실행해도 중복 삽입 안 됨).
-- 실행 순서: 37번(36 이후).
SET client_encoding TO 'UTF8';

UPDATE api_specs
SET error_codes = error_codes || COALESCE((
  SELECT jsonb_agg(elem)
  FROM jsonb_array_elements('[
    {"code": "REME000318", "name": "예약번호 또는 조회기간이 없습니다.", "desc": "입력 값에 예약번호(RSRV_NO) 또는 조회기간(RSRV_DATE_STRT, RSRV_DATE_END)이 없을 경우"},
    {"code": "REME000053", "name": "시작일자가 없습니다.", "desc": "입력 값에 시작일자(STRT_DATE)가 없을 경우"},
    {"code": "REME000054", "name": "종료일자가 없습니다.", "desc": "입력 값에 종료일자(CUST_NO)가 없을 경우"},
    {"code": "REME000166", "name": "조회 기간은 31일을 초과할 수 없습니다.", "desc": "조회 기간이 31일을 초과한 경우"},
    {"code": "REME000376", "name": "계약번호가 없습니다.", "desc": "입력 값에 계약번호(CONT_NO)가 없을 경우"}
  ]'::jsonb) elem
  WHERE NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(api_specs.error_codes) existing
    WHERE existing->>'code' = elem->>'code'
  )
), '[]'::jsonb)
WHERE domain = 'error-codes';
