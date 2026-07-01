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
- `partner`: 관리자 파트너 승인 시 자동 생성. `username = partner_code`, 초기 PW = `partner_code`(변경 기능 유무 **[Needs verification]**).

## 접근 제어 미들웨어
- `isAuthenticated`: 세션 user 없으면 `/auth/login` 리다이렉트. `home/guide/api-reference/support/admin`에 적용.
- `isAdmin`: `req.session.user.role === 'admin'` 아니면 403(`error/403`). `/admin` 전체에 `isAuthenticated`와 함께 적용.

## 파트너 신청 (`authController.apply`)
- `/auth/apply` POST → `partnerModel.create`(`status='pending'`). 성공 화면에 접수 안내. 승인은 관리자 몫(`docs/business-rules.md` §2).

## 주의 / 확인 필요
- 비밀번호 변경/재설정 UI 없음 → 초기 PW 유지 위험 **[Needs verification]**.
- 이메일 통지 로직 부재(문구만 존재) **[Needs verification]**.
- 로그인 실패 rate-limit/lockout 없음.
- `role` 스키마 기본값(`user`) vs 실제(`admin`/`partner`) 불일치.
