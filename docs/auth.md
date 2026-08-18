# Auth — 인증/권한 상세

> Source of truth: `src/middlewares/**`, `src/controllers/authController.js`, `src/models/userModel.js`, `src/app.js`. Update when auth changes.

## 세션
- `express-session` 사용. 쿠키: `httpOnly: true`, `secure: NODE_ENV==='production'`, `maxAge: 24h`.
- `SESSION_SECRET`(env). 미설정 시 `'hapi-dev-secret'` 폴백 → **운영에서 반드시 설정**.
- 로그인 성공: `req.session.user = { id, name, role, partnerId }`. `app.js`가 이를 `res.locals.user`로 주입.

## 로그인 흐름 (`authController.login`)
1. `username`(또는 `partner_code`) + `password` 입력 검증(빈값 차단).
2. `userModel.findByUsername` → 없으면 실패.
3. `bcrypt.compare(password, password_hash)` → 불일치 실패.
4. 성공 시 세션 저장 후 `/home` 리다이렉트. 실패 메시지는 계정/비번 구분 없이 동일("계정 정보가 올바르지 않습니다").

## 계정 종류
- `admin`: `npm run db:setup`로 생성(`admin`/`admin123`). 전 관리자 기능 접근.
- `BigCorp`: 관리자 파트너 승인 시 자동 생성. `username = partner_code`, 초기 PW = `partner_code`. 숫자로만 구성돼 비밀번호 정책(아래)을 만족하지 못하므로 `must_change_password=true`로 생성되어 최초 로그인 직후 비밀번호 변경이 강제된다.

## 비밀번호 정책 (`src/utils/passwordPolicy.js`)
- 규칙(`validatePasswordPolicy`): 10~64자, 영문 대/소문자·숫자·특수문자 각 1자 이상, 공백 금지, 동일 문자 3연속 금지, 아이디(대소문자 무시) 포함 금지. 위반 시 사유를 배열로 반환.
- 변경 주기(`PASSWORD_MAX_AGE_DAYS = 365`, `isPasswordExpired`): `users.password_changed_at` 기준 1년 경과 시 만료로 판단. 새 스키마 적용 시점 기존 계정은 컬럼 기본값 `now()`라 그 시점부터 1년 유예.
- 적용 대상: 위 정책은 `/auth/change-password`(자율 변경)에서만 강제한다. 관리자 승인 시 자동 발급되는 파트너 초기 비밀번호(`partner_code`)와 `npm run db:setup`의 `admin123`은 기존 업무 흐름 보존을 위해 정책 검증 없이 그대로 발급하되, 파트너 계정은 위와 같이 최초 로그인 후 변경을 강제한다.

## 비밀번호 변경 (`authController.changePassword`, `/auth/change-password`)
- 로그인 상태에서만 접근 가능(세션 미보유 시 `/auth/login` 리다이렉트, `isAuthenticated` 미들웨어 체인 밖이라 컨트롤러가 직접 체크).
- 흐름: 현재 비밀번호 `bcrypt.compare` 확인 → 새 비밀번호 정책 검증 → 현재 비밀번호와 동일 여부 확인(거부) → `bcrypt.hash` 후 `userModel.updatePassword`(=`password_hash`/`password_changed_at`/`must_change_password=false` 갱신) → 세션 갱신 → `/home` 리다이렉트.
- 헤더 우측 "비밀번호 변경" 링크(`views/partials/header.ejs`, 로그인 사용자 공통)로 자율 접근 가능.

## 비밀번호 변경 강제 (`middlewares/requirePasswordChange.js`)
- `app.js`에 전역 등록(로그인 세션 존재 + `/auth/*` 아닌 모든 요청에 적용). `session.user.mustChangePassword`가 true이거나 `isPasswordExpired(session.user.passwordChangedAt)`가 true면 `/auth/change-password?forced=1|expired=1`로 리다이렉트.
- `passwordChangedAt`/`mustChangePassword`는 로그인 시 세션에 저장(`authController.login`)되며 변경 완료 시 세션에서 즉시 갱신(재로그인 불필요).
- 배포 직후 기존 세션(필드 미보유)은 `isPasswordExpired`가 값 없음을 만료로 취급하지 않아 강제 리다이렉트되지 않음 — 다음 로그인부터 정상 적용.

## 접근 제어 미들웨어
- `isAuthenticated`: 세션 user 없으면 `/auth/login` 리다이렉트. `home/guide/api-reference/support/admin`에 적용.
- `isAdmin`: `req.session.user.role === 'admin'` 아니면 403(`error/403`). `/admin` 전체에 `isAuthenticated`와 함께 적용.

## 파트너 신청 (`authController.apply`)
- `/auth/apply` POST → `partnerModel.create`(`status='pending'`). 성공 화면에 접수 안내. 승인은 관리자 몫(`docs/business-rules.md` §2).

## 주의 / 확인 필요
- 비밀번호 재설정(분실 시 본인인증 후 재발급) UI 없음 — 변경(로그인 상태에서 현재 비밀번호 확인 후 변경)만 지원 **[Needs verification: 분실 시 관리자 수동 처리 절차 필요 여부]**.
- 이메일 통지 로직 부재(문구만 존재) **[Needs verification]**.
- 로그인 실패 rate-limit/lockout 없음.
- `role` 스키마 기본값(`user`) vs 실제(`admin`/`BigCorp`) 불일치.
- `admin` 계정(`admin123`)은 비밀번호 정책 미검증 상태로 시드되며 `must_change_password`도 강제하지 않음 — 운영 반입 전 수동 변경 권장 **[Needs verification]**.
