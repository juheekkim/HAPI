# Backend — 상세 (Express)

> Source of truth: `src/{app.js,routes,controllers,models,middlewares,config,scripts}`. Update when server logic changes.

## 앱 부트스트랩 (`app.js`)
- View engine EJS + layouts, body parser(urlencoded+json), static(`public`), `express-session`.
- 세션 → `res.locals.user` 주입 미들웨어.
- 라우트 등록: `/auth`, `/home`, `/guide`, `/api-reference`, `/support`, `/admin`. `/`는 로그인 여부로 리다이렉트.
- 404 → `error/404` 렌더, 에러 핸들러 → `error/500` 렌더.

## 계층
`routes → controllers → models → DB`. 별도 service/dao 없음 — **models/*가 DAO**. DB 접근은 공유 `pg` Pool(`config/database.js`).

## 라우트 요약
- `auth`: `GET/POST /login`, `POST /logout`, `GET/POST /apply`.
- `home`,`guide`,`api-reference`: `isAuthenticated` 후 `GET /`.
- `support`: `/`, `/inquiry`(GET/POST), `/firewall-apply`(GET/POST). 모두 `isAuthenticated`.
- `admin`: `router.use(isAuthenticated, isAdmin)` 후 partners/firewall/inquiries/notices CRUD·상태변경, **apis**(`/admin/apis`) CRUD(등록/수정/삭제 + 목록/폼).

## 컨트롤러 규약
- `'use strict'`, 객체 리터럴로 핸들러 export.
- async 핸들러는 try/catch로 감싸 `console.error` 로깅, 조회 실패 시 빈 배열/폴백으로 렌더(사용자 화면 유지).
- POST 처리 후 목록 화면으로 `res.redirect`.

## 모델 규약
- 파라미터 바인딩(`$1,$2,...`)만 사용. `RETURNING *`로 생성 결과 반환.
- 일부 조회 모델은 DB 오류/빈 결과 시 **STATIC fallback**(데모): `partnerModel`, `noticeModel`, `inquiryModel.getRecent`, `firewallModel`, `apiSpecModel`. 신규 조회 추가 시 이 패턴 유지 여부 판단.
- 관리자 전용 목록(`getAllForAdmin` 계열: `noticeModel`, `apiSpecModel`)은 fallback 없이 DB 실제 상태만 반환 — 관리 화면에서 STATIC 데모 데이터가 실 데이터처럼 보이지 않게 함.
- `apiSpecModel`은 조회(`getAll`, fallback 있음)와 Admin CRUD(`getAllForAdmin/getById/create/update/delete`, fallback 없음)를 함께 제공하는 **API Reference·Admin 공유 모델**이다. `domain UNIQUE` 위반은 그대로 throw하고 컨트롤러가 `err.code === '23505'`로 판별해 사용자 메시지로 변환한다.
- `headerFieldModel`: API Reference 헤더 정보(SystemHeader/TransactionHeader/MessageHeader) DB 관리 모델. `getBySection()`, `getByCategory()`, `getAllWithGrouping()`(section/category 그룹화) 제공. `apiReferenceController.index()`에서 `getAllWithGrouping()` 호출 → system/transaction/message 모두 `{ category, fields }[]` 형태로 통일해 `headerFields`에 담아 뷰에 주입. 뷰는 3개 섹션 모두 공통 partial `views/apiReference/_headerFieldTable.ejs`(구분/필드명KO·EN/항목유형/길이/Offset/생성주체(Request·MCI·Response)/비고/Setting Value(Type·value) 컬럼 통일, `구분` rowspan)로 렌더링한다.
- 채번: 파트너 코드=8자리 숫자, 방화벽 토큰=`HWR########`(applies) / `HNRTK-XXXXXXXX`(firewall_requests, crypto).

## 인증/보안
- 상세는 `docs/auth.md`. bcrypt 해시, 세션 쿠키(`httpOnly`, `secure` in prod, maxAge 1d).
- 비밀값은 `.env`. `SESSION_SECRET` 기본값 하드코딩 폴백 존재 → 운영에서 반드시 설정.

## 알려진 이슈 / 확인 필요
- **방화벽 토큰 발급 불일치**: `adminController.issueToken` → `firewallModel(firewall_requests)`인데 목록/승인은 `partner_firewall_applies`. 정리 필요 **[Needs verification]**. (docs/db-schema.md #1)
- `error/500.ejs` 존재 여부 확인 필요(app.js가 렌더) **[Needs verification]**.
- `scripts/createPartnerUser.js`는 접속 문자열 하드코딩 — 개발용, 운영 사용 금지.
- 서버측 입력 검증 보강 여지(신청/문의/방화벽 폼).

## 변경 시 문서 갱신
- API/서비스/배치/연계 변경 → `docs/backend.md`, `docs/api.md`(및 규칙 변경 시 `docs/business-rules.md`) 동시 갱신.
