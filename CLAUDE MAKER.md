# CLAUDE.md

이 문서는 **HAPI** 프로젝트에서 Claude Code가 작업할 때 참고해야 하는 컨텍스트 파일입니다.
프로젝트 구조, 기술 스택, 개발/문서화/DB 관리 컨벤션을 정의합니다.

---

## 1. 프로젝트 개요

- **프로젝트명**: HAPI (리조트 API 플랫폼)
- **서비스 목적**: 리조트 연동 고객사/협력업체가 시스템 개발을 진행할 때 API 스펙을 쉽게 확인하고, JSON 샘플 및 설명 등의 레퍼런스를 제공받을 수 있도록 하는 API 문서/레퍼런스 플랫폼
- **주요 사용자**
  - 외부 연동사(고객사/업체) 개발 담당자: API 스펙 조회, 요청/응답 샘플 확인
  - 내부 운영/기획 담당자: API 문서 등록·수정, 고객사 관리, 공지 관리

---

## 2. 기술 스택

| 영역 | 사용 기술 |
|---|---|
| Front-end | EJS (HTML + CSS + JavaScript), 별도 SPA 프레임워크 미사용 |
| Back-end | Node.js (Express 기반) |
| DBMS | PostgreSQL |
| 패키지 매니저 | npm |

---

## 3. 디렉토리 구조

```
hapi/
├── CLAUDE.md
├── package.json
├── .env.example
├── docs/                        # 지식 베이스 (산출물 ②)
│   ├── architecture.md          # 아키텍처/요청 흐름
│   ├── database.md              # DB 스키마/ERD/변경 이력
│   ├── development.md           # 개발 환경 셋업/실행 방법
│   ├── menu-structure.md        # 메뉴/화면 구성 및 캡쳐 인덱스
│   ├── team-ownership.md        # 개발자별 담당 영역/충돌 방지 규칙
│   ├── coding-convention.md     # ESLint + Prettier 코딩 규칙
│   └── screenshots/             # 화면 캡쳐 (산출물 ④), 대메뉴 기준 하위 폴더
│       ├── home/
│       ├── guide/               # 시작하기
│       ├── api-reference/
│       ├── support/             # 운영 지원
│       └── admin/               # 관리자
├── db/
│   └── scripts/                 # DB 스크립트 (산출물 ③)
│       ├── 01_create_database.sql
│       ├── 02_create_tables.sql
│       ├── 03_create_indexes_constraints.sql
│       ├── 04_seed_data.sql
│       └── README.md            # 스크립트 실행 순서/이력 안내
└── src/
    ├── app.js
    ├── config/                  # DB 커넥션, 환경설정
    ├── routes/                  # 메뉴 단위로 분리
    ├── controllers/
    ├── models/                  # 또는 repositories/, DB 쿼리 모듈화
    ├── views/                   # ejs, 메뉴 단위 하위 폴더
    │   ├── layouts/
    │   └── partials/
    └── public/
        ├── css/
        ├── js/
        └── images/
```

---

## 4. 메뉴 구조 및 화면 구성

아래는 확정된 포털 메뉴 구조입니다. 메뉴 변경 시 이 섹션과 `docs/menu-structure.md`를 함께 갱신하고, `routes/`, `views/`, `controllers/` 폴더도 동기화합니다.

| 대메뉴 | 서브 메뉴 | 설명 |
|---|---|---|
| **HOME** | 소개 | 서비스 소개 |
| | 주요 기능 | 주요 기능 안내 |
| | API 현황 | API 목록 및 상태 |
| | 방화벽(IP) 등록 요청 | 빠른 신청 버튼 |
| **시작하기** | API 개요 | 연동 시작 가이드 |
| | 연동 절차 | 연동 프로세스 |
| | 개발 환경 안내 | 환경 정보 |
| | 테스트 환경 | 테스트 정보 |
| | 호출 기본 규칙 | 기본 규칙 |
| **API Reference** | 공통 API | API 문서 (공통 Header / 공통 Response 구조) |
| | 예약/투숙 API | API 문서 |
| | 골프 API | API 문서 |
| | 상품 API | API 문서 |
| | 기타 API | API 문서 |
| **운영 지원** | 공지사항 | |
| | 문의하기 | 문의 |
| **관리자** | 파트너사 관리 | 승인/반려 |
| | 공지사항 관리 | 공지 관리 |
| | 사용자 관리 | 계정 및 권한 관리 |
| | API 추가 | (API 등록/관리) |

### 메뉴-코드 매핑 규칙
- 라우트는 대메뉴 단위로 분리하고, 서브 메뉴는 하위 경로로 구성합니다.
  - `routes/home.js`, `routes/guide.js`(시작하기), `routes/apiReference.js`, `routes/support.js`(운영 지원), `routes/admin.js`(관리자)
- 뷰는 대메뉴 폴더 하위에 서브 메뉴별 ejs를 둡니다. 예) `views/apiReference/common.ejs`, `views/apiReference/booking.ejs`, `views/apiReference/golf.ejs` 등
- **HOME / 시작하기 / API Reference / 운영 지원**: 외부 연동사·일반 사용자 접근 영역
- **관리자**: 인증/권한 체크 미들웨어를 거치는 관리자 전용 영역. 파트너사 승인/반려, 공지 관리, 사용자(계정/권한) 관리, API 등록·관리 기능을 담당
- **API Reference**의 각 도메인(공통/예약·투숙/골프/상품/기타) API 문서는 요청·응답 명세, JSON 샘플, 에러 코드, 공통 Header/Response 구조를 포함합니다.
- **방화벽(IP) 등록 요청**, **문의하기**는 신청·문의 데이터를 저장하고 관리자 영역에서 처리(승인/반려, 응답)할 수 있도록 연계합니다.

---

## 5. 개발 컨벤션

- 계층 분리: `routes` → `controllers` → `models(repositories)` → DB
- DB 접근은 `pg`(node-postgres) Pool을 사용하고, 쿼리는 `models/` 하위에 모듈화
- 공통 레이아웃은 `views/layouts`, 공통 컴포넌트는 `views/partials`에 위치
- 코드 스타일: **ESLint + Prettier** 조합을 표준으로 사용 (ESLint=코드 품질, Prettier=포맷팅, `eslint-config-prettier`로 충돌 방지). 상세 규칙은 **`docs/coding-convention.md`** 참조
- 환경변수는 `.env`로 관리하며 `.env.example`에 필수 키 목록을 유지 (실값은 커밋 금지)
- 기능 추가/변경 시 관련 `docs/*.md`를 함께 갱신하는 것을 기본 원칙으로 함

---

## 6. 개발자 협업 룰 (담당 영역)

> **중요: 모든 코드 작업 전에 반드시 `docs/team-ownership.md`를 먼저 확인합니다.**
> 각 개발자는 자신의 담당 영역만 수정하며, 타 개발자의 담당 영역(routes/views/controllers/models)을 침범하지 않습니다.
> 담당 영역이 모호하거나 공통 영역 변경이 필요한 경우, 임의로 수정하지 말고 협의 후 진행합니다.

| 개발자 | 담당 대메뉴/영역 | 주요 코드 경로 |
|---|---|---|
| **윤태윤** | HOME | `routes/home.js`, `controllers/homeController.js`, `views/home/`, 관련 `models/` |
| **김주희** | 시작하기 (Guide) | `routes/guide.js`, `controllers/guideController.js`, `views/guide/`, 관련 `models/` |
| **박승욱** | API Reference | `routes/apiReference.js`, `controllers/apiReferenceController.js`, `views/apiReference/`, 관련 `models/` |
| **김은성** | 운영 지원 (Support) | `routes/support.js`, `controllers/supportController.js`, `views/support/`, 관련 `models/` |
| **임가윤** | 관리자 (Admin) | `routes/admin.js`, `controllers/adminController.js`, `views/admin/`, 관리자 인증·권한 미들웨어, 관련 `models/` |

### 공통 영역 (전원 협의 후 변경)
다음은 특정 1인의 단독 소유가 아니므로, 변경 시 영향 범위를 확인하고 협의합니다.
- `src/app.js`, `src/config/` (DB 커넥션, 환경설정)
- `views/layouts/`, `views/partials/` (공통 레이아웃·컴포넌트)
- `public/css/`, `public/js/`, `public/images/` 중 공용 자원
- `db/scripts/` (DB 스키마) — 6→7. DB 스키마 관리 정책을 따르되, 테이블 신설/변경은 해당 도메인 담당자가 작성하고 공유

### 충돌 방지 원칙
- 자신의 담당 영역 외 파일은 읽기 참조만 하고 직접 수정하지 않습니다.
- 공통 컴포넌트(레이아웃/partials)에 변경이 필요하면 별도 협의·리뷰를 거칩니다.
- 상세 룰과 경계(파일 단위 소유권, 예외 케이스)는 **`docs/team-ownership.md`** 에 정의하며, 본 표와 항상 일치하도록 유지합니다.

---

## 7. DB 스키마 관리 정책 (산출물 ③)

- 모든 DDL/DML은 `db/scripts/` 하위에 **두 자리 순번 prefix**로 관리합니다. (`01_`, `02_`, ...)
- **`01`부터 마지막 순번까지 순서대로 실행하면 앱이 바로 정상 구동되는 상태**가 되도록 스크립트 세트를 구성합니다.
  1. `01_create_database.sql` — DB/Role/Schema 생성
  2. `02_create_tables.sql` — 테이블 생성
  3. `03_create_indexes_constraints.sql` — 인덱스, FK, 제약조건
  4. `04_seed_data.sql` — 마스터/기본 데이터 삽입
  5. 이후 변경분은 `05_`, `06_`... 순서로 계속 추가
- **기존 스크립트는 직접 수정하지 않습니다.** 스키마 변경(컬럼 추가, 테이블 변경 등)이 발생하면 새 순번의 스크립트를 추가하여 변경 이력을 보존합니다.
- 스키마가 변경될 때마다 `docs/database.md`(테이블 명세, ERD, 컬럼 설명)를 함께 갱신합니다.
- `db/scripts/README.md`에 전체 스크립트 목록과 각 스크립트의 적용 일자/목적을 기록합니다.

---

## 8. 문서화 정책 (산출물 ①, `docs/*.md`)

| 파일 | 내용 |
|---|---|
| `architecture.md` | 전체 아키텍처, 폴더 구조, 요청/응답 흐름, 모듈 간 의존관계 |
| `database.md` | 테이블 명세, ERD, 컬럼 설명, 스키마 변경 이력 |
| `development.md` | 로컬 개발 환경 셋업, 실행 방법, 배포/테스트 방법 |
| `menu-structure.md` | 메뉴/화면 구조, 화면별 설명, 화면 캡쳐 이미지 링크 |
| `team-ownership.md` | 개발자별 담당 영역, 파일 단위 소유권, 충돌 방지 규칙 (CLAUDE.md 6장과 매핑) |
| `coding-convention.md` | ESLint + Prettier 기반 코드 품질·포맷팅 규칙, 설정 파일·스크립트 |

위 문서들은 신규 기능 추가, 메뉴 변경, DB 스키마 변경이 발생할 때마다 **즉시 갱신**하여 항상 최신 상태를 유지합니다.

---

## 9. 화면 캡쳐 관리 (산출물 ④)

- 위치: `docs/screenshots/{메뉴명}/`
- 파일명 규칙: `{메뉴명}_{화면설명}_{버전or날짜}.png`
- `docs/menu-structure.md`에서 각 화면 설명과 함께 해당 캡쳐 이미지를 링크하여, 화면 구성을 참조할 수 있도록 합니다.
- 화면 UI가 변경되면 캡쳐도 함께 교체합니다.

---

## 10. 환경 설정 및 실행 방법

1. `npm install`
2. PostgreSQL에 `db/scripts/` 내 스크립트를 순번대로 실행 (또는 `npm run db:init`으로 일괄 실행 스크립트 구성)
3. `.env.example`을 참고하여 `.env` 작성 (예: `DATABASE_URL`, `PORT`)
4. `npm run dev` (nodemon 등으로 개발 서버 구동)

---

## 11. Claude Code 작업 시 유의사항

- **작업 전 `docs/team-ownership.md`를 반드시 확인하고, 요청된 작업이 어느 개발자 담당 영역인지 파악합니다. 해당 담당 영역 외 파일은 수정하지 않습니다.**
- 새로운 메뉴/화면 추가 시: `routes`, `views`, `controllers`를 함께 생성하고 `docs/menu-structure.md`를 갱신합니다.
- DB 변경 시: 새 순번 스크립트를 추가하고 `docs/database.md`를 갱신합니다. 기존 스크립트는 수정하지 않습니다.
- 공통 영역(`app.js`, `config/`, `layouts/`, `partials/`, 공용 자원) 변경이 필요하면 단독 수정하지 말고 협의가 필요함을 안내합니다.
- 화면 작업이 완료되면 가능한 경우 `docs/screenshots/`에 캡쳐를 추가하도록 사용자에게 안내합니다.
- 모든 변경 사항은 관련 `docs/*.md`에 함께 반영하는 것을 기본 원칙으로 합니다.

---

## 12. 메뉴 권한
- "관리자" 메뉴는 관리자 계정만 보이게 하고, 그 외 사용자는 보이지 않게 한다.
- 프론트에서 숨기는 건 UX일 뿐, 최종 권한 검증은 항상 서버에서 — 이 원칙은 모든 개발자가 동일하게 따라야 함을 문서에 명시.

---

## 13. 공통 레이아웃

- 아래 명시된 공통 레이아웃은 각 개발자가 개발 시 건드리지 않도록 한다.
상단 헤더
좌측 메뉴
본문 영역
사용자 프로필 영역
로그아웃 버튼
현재 메뉴 표시
권한에 따른 메뉴 노출

---

## 14. API client(프론트단 서비스 호출 공통부)

- 프론트에서 백엔드 서비스 호출 시 통신 방식은 통일한다.
fetch('/api/apis')
axios.get('/users')
fetch(process.env.API_URL + '/role-list')
=> 호출부 통일 EX) apiClient.get('/apis')

---

## 15. 인증 가드

- 화면별 권한 관리 및 검증 체계 마련
<PermissionGuard permission="USER_MANAGE">
  <UserManagementPage />
</PermissionGuard>
