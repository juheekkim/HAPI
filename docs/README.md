# docs 인덱스

HAPI 프로젝트 상세 문서 모음. 루트/영역별 AI 지시문이 참조한다. **Source of truth는 코드**이며, 코드 변경/새 사실 발견 시 해당 문서를 즉시 갱신한다.

## 참조 문서
- `architecture.md` — 시스템 개요, 스택, 디렉터리, 계층/흐름, 외부 연계
- `modules.md` — 업무 모듈 목록·역할·위치·의존성
- `db-schema.md` — 테이블/컬럼/관계/인덱스/쿼리/주의사항
- `business-rules.md` — 권한·온보딩·방화벽·공지/문의 규칙, 예외
- `development.md` — 환경/실행/빌드/수정 절차/테스트/문서 갱신
- `frontend.md` — EJS SSR 뷰/에셋/렌더 규약
- `backend.md` — Express 라우트/컨트롤러/모델 규약, 알려진 이슈
- `auth.md` — 세션/로그인/권한/계정
- `api.md` — 포털이 문서화하는 리조트 API 스펙
- `menu-routing.md` — 대메뉴↔라우트↔엔드포인트 매핑
- `chatbot.md` — 챗봇 위젯(OpenAI function calling, tools, 보안 범위, 대화 이력)

## 함께 보는 루트 문서 (별도 유지)
- `../team-ownership.md` — 개발자별 담당/소유 파일 (작업 전 필독)
- `../coding-convention.md` — ESLint/Prettier 코드 규칙

## AI 지시문 위치
- 루트: `../AGENTS.md`, `../CLAUDE.md`, `../GEMINI.md`, `../.github/copilot-instructions.md`
- 영역: `../frontend/`, `../backend/`, `../db/` 의 `AGENTS.md`/`CLAUDE.md`/`GEMINI.md`
- 경로별(Copilot): `../.github/instructions/{frontend,backend,db}.instructions.md`
- 오버라이드: `../AGENTS.override.md` (임시 전용, 루트보다 우선하지 않음)
