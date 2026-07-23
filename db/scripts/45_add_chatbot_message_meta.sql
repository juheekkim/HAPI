-- 챗봇 assistant 메시지의 링크/트리 재구성용 메타(apiDocs 등)를 저장한다.
-- 새로고침·재접속 후 이력 복원 시 텍스트뿐 아니라 링크/API 트리도 그대로 유지하기 위함
-- (메타가 없으면 기존처럼 텍스트만 복원). docs/chatbot.md, docs/db-schema.md 참고.
ALTER TABLE chatbot_messages ADD COLUMN IF NOT EXISTS meta JSONB;
