# 개발자 담당 영역 (Team Ownership)

HAPI 프로젝트의 **개발자별 코드 소유권과 충돌 방지 규칙**입니다.
`CLAUDE.md`의 팀 협업 섹션과 항상 일치하도록 유지합니다. **모든 코드 작업 전 이 문서를 먼저 확인**합니다.

---

## 1. 개발자 및 담당 대메뉴

| 개발자 | 담당 영역 | 핵심 책임 |
|---|---|---|
| **윤태윤** | HOME | 서비스 소개, 주요 기능 안내, API 현황, 방화벽(IP) 등록 요청(신청 폼) |
| **김주희** | 시작하기 (Guide) | API 개요, 연동 절차, 개발 환경 안내, 테스트 환경, 호출 기본 규칙 |
| **박승욱** | API Reference | 공통 API, 예약/투숙 API, 골프 API, 상품 API, 기타 API 문서 (JSON 샘플, 에러 코드, 공통 Header/Response) |
| **김은성** | 운영 지원 (Support) | 공지사항(조회), 문의하기(문의 등록) |
| **임가윤** | 관리자 (Admin) | 파트너사 관리(승인/반려), 공지사항 관리, 사용자 관리(계정·권한), API 추가, 관리자 인증·권한 미들웨어 |

---

## 2. 개발자별 소유 파일 경로

각 개발자는 아래 경로의 파일을 **단독으로 생성·수정**합니다.
타 개발자의 경로는 읽기 참조만 하며 직접 수정하지 않습니다.

### 윤태윤 — HOME
- `src/routes/home.js`
- `src/controllers/homeController.js`
- `src/views/home/**`
- `src/models/` 중 HOME 전용 쿼리 모듈 (예: `homeModel.js`, 방화벽 신청 관련)
- `src/public/js/home/**`, `src/public/css/home/**`
- `docs/screenshots/home/**`

### 김주희 — 시작하기 (Guide)
- `src/routes/guide.js`
- `src/controllers/guideController.js`
- `src/views/guide/**`
- `src/models/` 중 가이드 전용 모듈
- `src/public/js/guide/**`, `src/public/css/guide/**`
- `docs/screenshots/guide/**`

### 박승욱 — API Reference
- `src/routes/apiReference.js`
- `src/controllers/apiReferenceController.js`
- `src/views/apiReference/**` (common, booking, golf, product, etc.)
- `src/models/` 중 API 문서/스펙 관련 모듈
- `src/public/js/api-reference/**`, `src/public/css/api-reference/**`
- `docs/screenshots/api-reference/**`

### 김은성 — 운영 지원 (Support)
- `src/routes/support.js`
- `src/controllers/supportController.js`
- `src/views/support/**` (notice, inquiry)
- `src/models/` 중 공지/문의 관련 모듈
- `src/public/js/support/**`, `src/public/css/support/**`
- `docs/screenshots/support/**`

### 임가윤 — 관리자 (Admin)
- `src/routes/admin.js`
- `src/controllers/adminController.js`
- `src/views/admin/**` (partner, notice-manage, user-manage, api-add)
- `src/middlewares/auth*.js` (관리자 인증·권한 미들웨어)
- `src/models/` 중 관리자/계정/권한 관련 모듈
- `src/public/js/admin/**`, `src/public/css/admin/**`
- `docs/screenshots/admin/**`

---

## 3. 공통 영역 (전원 협의 후 변경)

아래 파일/폴더는 특정 1인의 단독 소유가 아닙니다. 변경 시 영향 범위를 공유한 뒤 리뷰·협의를 거칩니다.

| 공통 영역 | 경로 | 비고 |
|---|---|---|
| 앱 진입점 | `src/app.js` | 라우트 등록, 미들웨어 체인 |
| 설정 | `src/config/**` | DB 커넥션, 환경설정 |
| 공통 레이아웃/컴포넌트 | `src/views/layouts/**`, `src/views/partials/**` | 헤더/푸터/네비게이션 등 |
| 공용 정적 자원 | `src/public/css/common*`, `src/public/js/common*`, `src/public/images/**` | 공통 스타일·스크립트·이미지 |
| DB 스키마 | `db/scripts/**` | CLAUDE.md 7장 정책 준수 |
| 패키지/환경 | `package.json`, `.env.example` | 의존성·환경키 추가 시 공유 |

---

## 4. DB 테이블 소유 가이드

테이블은 도메인 담당자가 신설·변경 스크립트를 작성하되, `db/scripts/`는 공통 영역이므로 작성 후 공유합니다.
(테이블명은 예시이며 실제 설계 확정 시 `docs/database.md`와 함께 갱신)

| 도메인 | 담당 | 예시 테이블 |
|---|---|---|
| HOME / 방화벽 신청 | 윤태윤 | `firewall_request` |
| 시작하기 콘텐츠 | 김주희 | `guide_content` |
| API 스펙/문서 | 박승욱 | `api_spec`, `api_category`, `api_sample` |
| 공지/문의 | 김은성 | `notice`, `inquiry` |
| 파트너사/사용자/권한 | 임가윤 | `partner`, `user`, `role`, `permission` |

> 여러 도메인이 공유하는 테이블(예: 공통 코드)은 공통 영역으로 간주하여 협의 후 작성합니다.

---

## 5. 충돌 방지 원칙

1. **담당 영역 외 파일은 직접 수정 금지** — 읽기 참조만 합니다.
2. **공통 영역 변경은 협의 필수** — `app.js`, `config/`, `layouts/`, `partials/`, 공용 자원, DB 스크립트.
3. **라우트 등록**은 각자 자신의 라우트 파일에서 정의하고, `app.js`에서의 `app.use()` 등록은 공통 영역이므로 추가 시 공유합니다.
4. **공통 컴포넌트 의존**: 공통 레이아웃/partials 변경이 다른 영역에 영향을 줄 수 있으므로, 변경 전 영향 범위를 확인합니다.
5. **타 영역 기능이 필요한 경우** 해당 담당자에게 요청하거나, 공통 유틸로 분리하는 방안을 협의합니다.
6. 문서(`CLAUDE.md`, `docs/*.md`)는 자신의 담당 영역 변경분에 한해 갱신하고, 공통 문서 구조 변경은 공유합니다.

---

## 6. 변경 이력

| 일자 | 변경 내용 | 작성자 |
|---|---|---|
| 2026-07-08 | 관리자(Admin) 서브메뉴 "API 등록/관리"(`/admin/apis`) 추가로 `src/models/apiSpecModel.js`가 API Reference(박승욱, 조회)와 Admin(임가윤, 등록/수정/삭제) 양쪽이 함께 쓰는 공유 모델이 됨. 변경 전 두 모듈 영향 확인 필요. | 김은성 |

> 담당 영역·소유 파일·테이블 매핑이 바뼀면 이 표에 이력을 남기고 `CLAUDE.md`도 함께 갱신합니다.
