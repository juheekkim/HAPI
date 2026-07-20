# Architecture — HAPI 리조트 API 플랫폼 포털

> Source of truth is the code under `src/` and `db/scripts/`. Update this file when the code changes or new facts are found. Guesses are marked **[Needs verification]**.

## 1. 시스템 개요
HAPI는 **리조트 API 플랫폼 가이드 포털**이다.
- 외부 연동사(파트너사)가 로그인하여 API 스펙·JSON 샘플·에러 코드를 조회하고, 방화벽/토큰을 신청하고, 문의를 남긴다.
- 내부 담당자(관리자)가 파트너사 승인/반려, 방화벽·토큰 요청 처리, 공지사항·문의(FAQ) 관리를 수행한다.

> Note: 상위 지시문 템플릿에는 "협력업체포탈 입찰/계약/구매자재" 설명이 있으나, **현재 코드베이스에는 입찰/계약/구매자재 도메인이 존재하지 않는다.** 실제 도메인은 리조트 API 연동 가이드/파트너 관리이다. (템플릿 문구는 다른 프로젝트 기준으로 보임 — **[Needs verification]**)

## 2. 기술 스택
- Runtime: Node.js, Express 4
- View: EJS + `express-ejs-layouts` (SSR, 레이아웃 `views/layouts/main.ejs`)
- DB: PostgreSQL, 드라이버 `pg` (Pool)
- Auth/Session: `express-session`, 비밀번호 해시 `bcrypt`
- Lint/Format: ESLint + Prettier (`coding-convention.md`)

## 3. 디렉터리 구조 (실제)
```
src/
├── app.js                 # 앱 진입점, 미들웨어/라우트 등록, 404·에러 핸들러
├── config/database.js     # pg Pool (DATABASE_URL)
├── routes/                # auth, home, guide, apiReference, support, admin, chatbot
├── controllers/           # 라우트별 컨트롤러 (동명)
├── models/                # DB 쿼리 모듈 (= 데이터 접근 계층)
├── middlewares/           # isAuthenticated, isAdmin
├── scripts/               # setup.js(어드민 생성), createPartnerUser.js
├── views/                 # EJS: layouts/, partials/(header, chatbot), home/, guide/, apiReference/, support/, admin/, auth/, error/
└── public/                # css/common.css, css/chatbot.css, js/common/apiClient.js, js/common/chatbot.js, images/chatbot-icon.svg
db/scripts/                # 01_, 02_, 07_, 16_ ... 42_ 누적 DDL/DML
docs/                      # 본 문서 세트
```
- 챗봇(우측 하단 위젯, `docs/chatbot.md`)은 모든 로그인 페이지 레이아웃에 공통 포함되는 **공통 영역** 모듈로, `routes/chatbot.js → controllers/chatbotController.js → models/chatbotModel.js`가 OpenAI function calling으로 기존 모델(공지/FAQ/API스펙/공통코드/에러코드/시스템정보/헤더필드/방화벽신청)을 재사용해 응답한다.
AI 지시문: 루트(`AGENTS.md`/`CLAUDE.md`/`GEMINI.md`/`.github/copilot-instructions.md`), 영역별(`frontend/`, `backend/`, `db/`), 경로별(`.github/instructions/*.instructions.md`), 오버라이드(`AGENTS.override.md`).

## 4. 계층 & 요청 흐름
```
Browser ──HTTP──▶ Express (app.js)
   └▶ session 미들웨어 → res.locals.user 주입
   └▶ Route (인증 미들웨어) → Controller → Model(pg Pool) → PostgreSQL
                                   └▶ res.render(EJS) → HTML
```
- `routes` → `controllers` → `models` → DB. 별도 service/dao 계층은 없으며 `models/*`가 DAO 역할.
- 브라우저 측 비동기 호출은 `public/js/common/apiClient.js`만 사용(직접 `fetch` 금지). 현재 화면 대부분은 폼 POST + 서버 렌더 방식.

## 5. frontend / backend / db 관계
- frontend(`views/**`, `public/**`)는 controller가 넘기는 `{ title, currentMenu, ...데이터 }`로 렌더된다.
- backend(`routes/controllers/models`)가 세션·권한·업무 로직·쿼리를 담당한다.
- db(`db/scripts/**` + `models/**`)가 스키마와 쿼리를 담당한다.

## 6. 주요 흐름 (요약; 상세는 docs/business-rules.md)
- 파트너 신청 → 관리자 승인 시 `partner_code`(8자리) 채번 + 로그인 계정 생성(초기 PW = code).
- 로그인(세션) → 메뉴 접근(전 메뉴 인증 필요, `/admin`은 admin 전용).
- 방화벽/토큰 신청(support) → 관리자 승인 시 토큰 채번(`HWR########`).
- 공지/문의: 관리자가 등록·답변, FAQ 노출 토글.
- API 스펙: 관리자가 `/admin/apis`에서 명칭·설명·Request/Response 파라미터를 직접 등록·수정 → API Reference 화면에 즉시 반영.

## 7. 외부 시스템 연계
- 포털이 문서화하는 리조트 API(콘도/골프/상품/H-LIVE 포인트/에스테이트/공통 인증·에러)는 **외부 백엔드 API이며 이 저장소에 구현체는 없다.** `api_specs`(DB) 또는 `apiSpecModel`의 STATIC_SPECS로 스펙만 제공. 실제 게이트웨이/인증 서버 연계는 **[Needs verification]**.
- DB 미연결 시 여러 모델이 STATIC fallback 데이터를 반환(데모 목적).

## 관련 문서
`docs/modules.md`, `docs/db-schema.md`, `docs/business-rules.md`, `docs/auth.md`, `docs/api.md`, `docs/menu-routing.md`, `docs/development.md`, `docs/chatbot.md`, 루트 `team-ownership.md`, `coding-convention.md`.
