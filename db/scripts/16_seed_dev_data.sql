-- 16_seed_dev_data.sql
-- 개발/데모용 샘플 데이터 (파트너사, 파트너 계정, 추가 문의)
-- 실행 순서: 16번 (01, 02, 07 실행 후 + npm run db:setup 실행 후)

-- 파트너사 샘플
INSERT INTO partners (company_name, manager_name, email, phone, purpose, status, reject_reason, partner_code, processed_at, created_at) VALUES
  ('야어때',               '김주희', 'juhee3111@hanwha.com',  '010-5111-3111', '연결해서 돈 마니 벌고 싶어요 안된다구요?', 'approved', NULL,                      '88007882', '2026-06-26 15:02:26+09', '2026-06-26 15:00:14+09'),
  ('저기어때',             '김은성', 'silverstar@hanwha.com', '010-1111-2222', '나는 silverstar. goldstar 댐벼보시지',     'rejected', 'silver는 취급 안합니데이', NULL,       '2026-06-26 15:02:37+09', '2026-06-26 15:00:50+09'),
  ('천수관컴퍼니',         '박승욱', 'beast00k@hanwha.com',   '010-3333-4444', '나는 짐승욱. 호랑이 댐벼라',              'approved', NULL,                      '69249209', '2026-06-26 15:02:40+09', '2026-06-26 15:01:22+09'),
  ('(주)거꾸로해도윤태윤', '윤태윤', 'yoonyoon@hanwha.com',   '010-0000-9999', '내가 대표요. 내가 왕이될 상이로다',       'pending',  NULL,                      NULL,       NULL,                    '2026-06-26 15:02:15+09');

-- 파트너 계정 (초기 PW = partner_code)
INSERT INTO users (username, password_hash, name, role, partner_id)
SELECT '88007882', '$2b$10$BR9V1nSrLnkNelk16NSIduzJsDb.xwj2tekO9J1TT20KKcCYfZMTC', '김주희', 'partner', id
FROM partners WHERE partner_code = '88007882'
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, name, role, partner_id)
SELECT '69249209', '$2b$10$8.pDioENqaMbBbYe5n63g.TUsfjQSKqQBnytXZQMhA0OPEr7HRLQq', '박승욱', 'partner', id
FROM partners WHERE partner_code = '69249209'
ON CONFLICT (username) DO NOTHING;

-- 추가 문의 샘플
INSERT INTO inquiries (user_id, question, answer, status, is_faq, answered_at, created_at) VALUES
  (
    (SELECT id FROM users WHERE username = '88007882'),
    E'아...문희가 있습니다\n가문희\n나문희 다문희!!!!!!!!!!!!!!!!!!',
    '라문희입니다.',
    'answered', TRUE, '2026-06-26 15:07:46+09', '2026-06-26 15:03:05+09'
  ),
  (
    (SELECT id FROM users WHERE username = '88007882'),
    '이22222222 문희는 답변을 대기하도록 하겠습니다',
    NULL,
    'pending', FALSE, NULL, '2026-06-26 15:03:18+09'
  ),
  (
    (SELECT id FROM users WHERE username = '69249209'),
    E'나도 문의가 있는데요~\n이렇게 쓰면\n되는 건지 궁금하기도\n하고 안궁금함',
    NULL,
    'pending', FALSE, NULL, '2026-06-26 15:33:08+09'
  ),
  (
    (SELECT id FROM users WHERE username = 'admin'),
    '나는 관리자입니다',
    E'정중히 신청해야 받아줍니다\n?\n??\n\n???\n????\n\nㅇㅇ',
    'answered', TRUE, '2026-06-26 15:35:30+09', '2026-06-26 15:35:12+09'
  ),
  (
    (SELECT id FROM users WHERE username = 'admin'),
    '문의 추가 테스트',
    '입니다',
    'answered', FALSE, '2026-06-26 15:53:54+09', '2026-06-26 15:53:54+09'
  );
