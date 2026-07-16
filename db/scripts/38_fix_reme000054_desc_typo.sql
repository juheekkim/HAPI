-- 38_fix_reme000054_desc_typo.sql
-- `37`에서 원본 그대로 넣은 REME000054의 desc가 "종료일자(CUST_NO)"로 되어 있었음(원본 문서 오타로
-- 확인, 같은 배치의 REME000053 "시작일자(STRT_DATE)"와 대응되는 필드명이라 END_DATE가 맞음).
-- 멱등(항상 같은 값으로 덮어씀).
SET client_encoding TO 'UTF8';

UPDATE api_specs
SET error_codes = (
  SELECT jsonb_agg(
    CASE WHEN elem->>'code' = 'REME000054'
      THEN jsonb_set(elem, '{desc}', '"입력 값에 종료일자(END_DATE)가 없을 경우"'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(error_codes) elem
)
WHERE domain = 'error-codes';
