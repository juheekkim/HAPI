# Development — 개발/실행/문서 갱신 가이드

> Source of truth: `package.json`, `.env`, `src/**`, `db/scripts/**`. Update when tooling/scripts change.

## 1. 개발 환경
- Node.js + npm, PostgreSQL 로컬 인스턴스.
- 환경변수(`.env`, 커밋 금지):
  - `PORT`(기본 3000), `NODE_ENV`(development/production), `DATABASE_URL`(`postgresql://user:pass@host:5432/db`), `SESSION_SECRET`.
  - `ANTHROPIC_API_KEY`, `MCI_SERVICE_BASE_URL`, `SANDBOX_GATEWAY_BASE_URL` — Admin API 등록/테스트 샌드박스용(없으면 501).
  - `CHATBOT_LLM_API_KEY`, `CHATBOT_LLM_BASE_URL`, `CHATBOT_LLM_MODEL`(기본 `gpt-5.4-mini`) — 챗봇 위젯용 사내 AI 허브 전용 키/엔드포인트(둘 중 하나라도 없으면 501). 호출 URL은 `{CHATBOT_LLM_BASE_URL}/{CHATBOT_LLM_MODEL}/invoke`. `docs/chatbot.md` 참고.
  - `.env.example`(키 목록 유지) 복구 완료.
  - 기존 로컬 컨벤션(`src/scripts/createPartnerUser.js`에 하드코딩): `postgresql://postgres:postgres@localhost:5432/hapi_db`.
- `28_local_data_snapshot.sql`/`29_local_data_snapshot_v2.sql`은 PostgreSQL 18.4에서 `pg_dump`한 파일이라 PG16 서버에서 실행 시 `SET transaction_timeout = 0;`(PG17+ 신규 파라미터) 줄에서 `unrecognized configuration parameter` 오류 발생. 해당 줄만 걸러서 실행: `grep -v "^SET transaction_timeout" 29_local_data_snapshot_v2.sql | psql ... `. 스크립트 파일 자체는 수정하지 않는다(기존 스크립트 수정 금지 원칙). **29번이 28번을 대체**(header_fields 테이블 포함, menus 중복 정리됨) — 로컬 DB를 새로 셋업할 때는 29번까지 순서대로 실행.

## 2. 실행
```bash
npm install
# PostgreSQL에 DB 생성 후 db/scripts/ 순번대로 실행 (01, 02, 07, 16 ... 43)
npm run db:setup     # 어드민 계정: admin / admin123
cp .env.example .env # 없으면 위 키로 직접 생성
npm run dev          # nodemon, http://localhost:3000
npm start            # 프로덕션 실행
```
- 챗봇 위젯을 쓰려면 `db/scripts/43_create_chatbot_clears_table.sql`까지 실행하고 `.env`에 `CHATBOT_LLM_API_KEY`/`CHATBOT_LLM_BASE_URL`을 채운다(미설정 시 위젯은 뜨지만 메시지 전송은 501).

## 3. 빌드
- 별도 번들 빌드 없음(SSR). 정적 자원은 `src/public`에서 직접 서빙.

## 4. 코드 품질 / 포맷
```bash
npm run lint         # ESLint
npm run lint:fix
npm run format       # Prettier write
npm run format:check
```
- 규칙: `coding-convention.md`(ESLint+Prettier, `'use strict'`, `eqeqeq`, `no-var`, `prefer-const`, single quote, 2-space, printWidth 100).

## 5. 코드 수정 절차
1. 작업 전 `team-ownership.md`에서 담당 영역 확인 — 본인 영역만 수정, 타 영역은 읽기 참조.
2. 관련 docs(`architecture/modules/db-schema/business-rules` + 영역 docs) 확인.
3. 계층 준수: `routes → controllers → models → DB`. 새 쿼리는 `models/*`에 둔다.
4. 공통 영역(`app.js`, `config/`, `views/layouts|partials`, `public/*/common*`, `db/scripts/`) 변경은 팀 협의.
5. DB 변경은 **새 순번 스크립트 추가**(기존 수정 금지) + `docs/db-schema.md` 갱신.

## 6. 테스트 / 검증
- 자동화 테스트 프레임워크 없음 **[Needs verification]**. 수동 검증: `npm run dev` 후 로그인→각 메뉴/폼 동작 확인.
- 최소 확인: 로그인(admin/파트너), 파트너 승인→계정 생성→파트너 로그인, 공지/문의/방화벽 신청·처리, API Reference `?doc=` 전환.

## 7. AI coding model 사용 시 주의
- 작업 전 루트 지시문(`AGENTS.md`/`CLAUDE.md`/`GEMINI.md`/Copilot) + 해당 영역 지시문(`frontend/`, `backend/`, `db/`) + 관련 docs를 먼저 읽는다.
- 지시문은 영어, 업무 설명은 한국어 허용. 코드/DB/API/식별자 원문 유지.
- 담당 영역 외 파일 수정 금지. 비밀값 커밋 금지. 임시 예외는 `AGENTS.override.md`만 사용(루트보다 우선하지 않음).

## 8. 문서 갱신 절차
- 코드 변경/새 사실 발견 시 관련 md 즉시 갱신(Source of truth = code).
- 루트 지시문은 콤팩트 유지(≤1000자), 상세는 `docs/`.
- 제품별 지시문 동기화: 루트 4종 동일, 영역별 3종(+Copilot instructions) 동일.
- 새 문서 카테고리가 필요하면 `docs/`에 적절한 파일명으로 추가.
