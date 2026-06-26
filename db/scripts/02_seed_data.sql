-- 02_seed_data.sql
-- HAPI 포털 기초 데이터 삽입
-- 실행 순서: 2번
-- ※ 어드민 계정은 별도로 `npm run db:setup` 실행

-- 공지사항 샘플
INSERT INTO notices (tag, tag_type, title, created_at) VALUES
  ('공지 NEW', 'new',    '[필독] API 인증 방식 변경 안내 (Bearer Token)',              '2025-08-01 09:00:00+09'),
  ('공지',     'notice', '스테이징 서버 점검 일정 안내 (8/15 02:00~06:00)',            '2025-07-28 09:00:00+09'),
  ('업데이트', 'update', '콘도예약 API v2.1 배포 안내 – 파라미터 추가',                '2025-07-20 09:00:00+09'),
  ('공지',     'notice', '추석 연휴 운영 안내 (9/15~9/17 긴급 대응팀 운영)',           '2025-07-10 09:00:00+09')
ON CONFLICT DO NOTHING;

-- Q&A 샘플 (user_id 없이 삽입)
INSERT INTO inquiries (user_id, question, answer, status) VALUES
  (NULL, '콘도예약 API 호출 시 401 오류가 발생합니다',             '토큰 만료 여부를 확인하고 재발급 신청해주세요.',    'answered'),
  (NULL, '방화벽 해제 처리 기간은 얼마나 걸리나요?',               '신청 후 1~2 영업일 이내 처리됩니다.',              'answered'),
  (NULL, '골프 예약 API에서 예약 취소 시 환불 처리는 어떻게 되나요?', NULL,                                               'pending')
ON CONFLICT DO NOTHING;

-- API 스펙 샘플 (콘도 예약)
INSERT INTO api_specs (category, domain, name, description, endpoints, display_order) VALUES
  (
    'resort', 'condo', '콘도 예약 API',
    '한화호텔앤드리조트 콘도 객실 예약을 생성·조회·변경·취소하는 API입니다.',
    '[
      {"method":"POST","url":"/api/v1/resort/condo/reserve","description":"예약 등록",
       "params":[
         {"name":"partnerId","type":"String","required":true,"desc":"파트너사 고유 코드"},
         {"name":"checkIn","type":"String","required":true,"desc":"입실일 (YYYY-MM-DD)"},
         {"name":"checkOut","type":"String","required":true,"desc":"퇴실일 (YYYY-MM-DD)"},
         {"name":"roomType","type":"String","required":false,"desc":"객실 유형 코드"},
         {"name":"guestCount","type":"Integer","required":false,"desc":"투숙 인원 수"}
       ],
       "responseExample":"{\"resultCode\":\"0000\",\"resultMsg\":\"예약이 완료되었습니다.\",\"data\":{\"reservationId\":\"RSV-20250801-000123\",\"status\":\"CONFIRMED\"}}"},
      {"method":"GET","url":"/api/v1/resort/condo/reserve/{id}","description":"예약 조회",
       "params":[{"name":"id","type":"String","required":true,"desc":"예약 ID (Path Variable)"}],
       "responseExample":null},
      {"method":"DELETE","url":"/api/v1/resort/condo/reserve/{id}","description":"예약 취소",
       "params":[{"name":"id","type":"String","required":true,"desc":"예약 ID (Path Variable)"}],
       "responseExample":null}
    ]'::jsonb,
    1
  )
ON CONFLICT (domain) DO NOTHING;
