# Modules — 업무 모듈

> Source of truth is the code. Update when routes/controllers/models/views change. Guesses marked **[Needs verification]**.

## 모듈 목록 & 담당 (see `team-ownership.md`)
| 모듈 | 대메뉴 | 담당 | 접근 |
|---|---|---|---|
| Home | HOME | 윤태윤 | 로그인 필요 |
| Guide | 시작하기 | 김주희 | 로그인 필요 |
| API Reference | API | 박승욱 | 로그인 필요 |
| Support | 운영 지원 | 김은성 | 로그인 필요 |
| Admin | 관리자 | 임가윤 | admin 전용 |
| Auth | (로그인/신청) | 공통 | 공개 |

## 모듈별 상세

### Home
- 역할: 포털 소개/랜딩.
- 위치: `routes/home.js` → `controllers/homeController.js` → `views/home/index.ejs`. 모델 없음(정적 렌더).

### Guide (시작하기)
- 역할: API 연동 절차/개발 환경 안내(정적 콘텐츠).
- 위치: `routes/guide.js` → `guideController.js` → `views/guide/index.ejs`. 모델 없음.

### API Reference
- 역할: API 스펙/엔드포인트/파라미터/응답 예시/에러 코드 조회. `?doc=<domain>`로 선택.
- 위치: `routes/apiReference.js` → `apiReferenceController.js` → `models/apiSpecModel.js` → `views/apiReference/index.ejs`.
- 데이터: `api_specs` 테이블. **DB 미연결/빈 테이블이면 `apiSpecModel.STATIC_SPECS` 반환**(condo/golf/product/hlive/estate/estate-facility/error-codes/auth).
- 기본 선택 `doc`는 컨트롤러 기본값 `'condo'`. 단, 헤더 링크는 `/api-reference?doc=header`로 존재하지 않는 domain이라 `specs[0]`으로 폴백됨 — **동작 확인 필요 [Needs verification]**.

### Support (운영 지원)
- 역할: 공지 조회, FAQ 조회, 문의 등록/내역, 방화벽·토큰 신청/내역.
- 위치: `routes/support.js` → `supportController.js` → `models/noticeModel.js`, `inquiryModel.js`, `partnerFirewallApplyModel.js` → `views/support/{index,inquiry,firewall-apply}.ejs`.
- 흐름: `/support`(공지+FAQ), `/support/inquiry`(내 문의), `/support/firewall-apply`(방화벽 신청).

### Admin (관리자)
- 역할: 파트너사 승인/반려, 방화벽·토큰 요청 처리, 문의 답변/FAQ 토글, 공지 CRUD/노출 토글, **API 등록/관리**(API 명칭·설명 및 Request/Response 파라미터 수기 등록·수정·삭제).
- 위치: `routes/admin.js`(`isAuthenticated`+`isAdmin`) → `adminController.js` → `partnerModel`, `partnerFirewallApplyModel`, `firewallModel`, `userModel`, `inquiryModel`, `noticeModel`, `apiSpecModel` → `views/admin/{partners,firewall,inquiries,notices,apis,api-form}.ejs`.
- API 등록/관리 서브메뉴(`/admin/apis`): `api_specs` 테이블을 CRUD. 목록은 `apiSpecModel.getAllForAdmin()`(STATIC fallback 없음, DB 실제 상태만 표시). 등록/수정 화면(`api-form.ejs`)은 엔드포인트(HTTP method/URL/설명/응답 예시)와 그 하위 Request 파라미터(파라미터명/타입/필수여부/설명)를 화면에서 동적으로 추가·삭제할 수 있는 폼을 제공하며, 제출 시 `endpoints` JSONB 배열로 직렬화되어 저장된다. 저장되는 구조는 API Reference가 읽는 `apiSpecModel.STATIC_SPECS`/`endpoints` 구조와 동일해 별도 변환 없이 API Reference 화면에 바로 노출된다.
- **참고**: `views/apiReference/index.ejs`의 좌측 사이드바는 domain 링크가 하드코딩되어 있어, Admin에서 새 `domain`을 등록해도 사이드바에는 자동으로 나타나지 않는다(URL `?doc=<domain>` 직접 접근은 가능). 사이드바를 동적으로 만들려면 API Reference 담당자(박승욱)와 협의가 필요하다.
- **소유권 메모**: `apiSpecModel.js`는 조회(API Reference, 박승욱)와 등록/관리(Admin, 임가윤) 양쪽에서 함께 사용하는 공유 모델이 되었다. 변경 시 두 모듈에 미치는 영향을 함께 검토한다(`team-ownership.md` 변경 이력 참조).

### Auth
- 역할: 로그인/로그아웃, 파트너사 코드 신청.
- 위치: `routes/auth.js` → `authController.js` → `userModel`, `partnerModel` → `views/auth/login.ejs`(`layout:false`).

## 모듈 간 의존성 / 분기
- 공통: 세션(`res.locals.user`), 헤더 partial(`currentMenu`, admin 노출 분기), `apiClient.js`.
- Admin 승인 → `partners.partner_code` 채번 + `users` 계정 생성 → 파트너 로그인 → Support/API 이용.
- Admin 방화벽 승인 → `partner_firewall_applies.token` 채번 → 파트너가 Support에서 확인.
- 포털 분기: 관리자/파트너 역할에 따라 헤더 메뉴(관리자 탭)만 분기. 별도 포탈 URL 분리는 없음.

## 방화벽 모듈 주의 (중요)
방화벽 관련 **두 개의 테이블/모델**이 공존한다:
- `partner_firewall_applies` + `partnerFirewallApplyModel` — Support 신청 화면과 Admin 목록/승인/반려에서 실제 사용.
- `firewall_requests` + `firewallModel` — 구형/데모용. Admin `issueToken`이 `firewallModel.issueToken(id)`를 호출하는데, 목록은 `partner_firewall_applies` 기준이라 **id 대상 테이블 불일치 가능성**. → **[Needs verification]** (docs/backend.md, docs/db-schema.md 참조).
