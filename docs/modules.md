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
- 역할: 파트너사 승인/반려, 방화벽·토큰 요청 처리, 문의 답변/FAQ 토글, 공지 CRUD/노출 토글.
- 위치: `routes/admin.js`(`isAuthenticated`+`isAdmin`) → `adminController.js` → `partnerModel`, `partnerFirewallApplyModel`, `firewallModel`, `userModel`, `inquiryModel`, `noticeModel` → `views/admin/{partners,firewall,inquiries,notices}.ejs`.

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
