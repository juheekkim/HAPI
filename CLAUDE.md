# CLAUDE.md

HAPI(리조트 API 플랫폼) 프로젝트에서 Claude Code가 참조하는 핵심 컨텍스트입니다.

## 프로젝트 개요
- **목적**
외부 연동사가 API 스펙·JSON 샘플을 조회하고, 내부 담당자가 API 문서·공지·파트너사를 관리하는 포털
- **스택**
Front-end : HTML, CSS, EJS
Back-end : Node.js, Express
Database : PostgreSQL
Database Driver : pg(Pool)
Package Manager : npm
Version Control : GitHub

## 디렉토리 구조
```
src/
├── app.js              # 앱 진입점, 라우트 등록
├── config/             # DB 커넥션, 환경설정
├── routes/             # 대메뉴 단위 (home, guide, apiReference, support, admin)
├── controllers/
├── models/             # DB 쿼리 모듈
├── views/              # EJS (layouts/, partials/ 포함)
└── public/             # css/, js/, images/
db/scripts/             # DDL/DML (순번 prefix: 01_, 02_, ...)
docs/                   # 문서 (coding-convention.md, team-ownership.md 등)
```

## 메뉴 & 라우트
| 대메뉴 | 라우트 파일 | 접근 |
|---|---|---|
| HOME | `routes/home.js` | 공개 |
| 시작하기 | `routes/guide.js` | 공개 |
| API Reference | `routes/apiReference.js` | 공개 |
| 운영 지원 | `routes/support.js` | 공개 |
| 관리자 | `routes/admin.js` | 인증 필요 |

## 개발 원칙
- 계층: `routes` → `controllers` → `models` → DB
- 코드 스타일: ESLint + Prettier → `docs/coding-convention.md` 참조
- `.env`로 환경변수 관리, 실값 커밋 금지 (`.env.example`에 키 목록 유지)
- 기능·메뉴·스키마 변경 시 관련 `docs/*.md` 즉시 갱신

## 팀 협업 — 작업 전 `docs/team-ownership.md` 필독
| 개발자 | 담당 | 핵심 경로 |
|---|---|---|
| 윤태윤 | HOME | `routes/home.js`, `controllers/homeController.js`, `views/home/**` |
| 김주희 | 시작하기 | `routes/guide.js`, `controllers/guideController.js`, `views/guide/**` |
| 박승욱 | API Reference | `routes/apiReference.js`, `controllers/apiReferenceController.js`, `views/apiReference/**` |
| 김은성 | 운영 지원 | `routes/support.js`, `controllers/supportController.js`, `views/support/**` |
| 임가윤 | 관리자 | `routes/admin.js`, `controllers/adminController.js`, `views/admin/**`, 인증 미들웨어 |

- 담당 영역 외 파일 **수정 금지** (읽기 참조만 허용)
- **공통 영역** (`app.js`, `config/`, `views/layouts/`, `views/partials/`, `db/scripts/`) 변경 시 팀 협의 필수

## DB 스키마 관리
- `db/scripts/`에 순번 prefix로 누적 관리 — **기존 스크립트 수정 금지**, 변경 시 새 순번 스크립트 추가
- 스키마 변경 시 `docs/database.md` 즉시 갱신

## 실행
```bash
npm install
# db/scripts/ 순번대로 실행 (또는 npm run db:init)
cp .env.example .env   # 환경변수 설정 후
npm run dev
```
