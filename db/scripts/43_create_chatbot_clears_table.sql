-- "새 대화" 버튼이 chatbot_messages를 삭제하지 않고, 사용자별 마지막 초기화 시점만 기록하도록
-- 변경(원본 대화 기록 보존). getHistory는 이 시점 이후 메시지만 조회한다. docs/chatbot.md 참고.
CREATE TABLE chatbot_clears (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  cleared_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
