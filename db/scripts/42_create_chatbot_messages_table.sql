-- 챗봇(우측 하단 위젯) 대화 이력. 사용자당 단일 연속 스레드(append-only, 대화방 개념 없음).
-- "새 대화" 버튼은 해당 사용자 행 전체 삭제. docs/chatbot.md, docs/db-schema.md 참고.
CREATE TABLE chatbot_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chatbot_messages_user_id ON chatbot_messages(user_id, created_at);
