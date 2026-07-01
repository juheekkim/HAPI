# Menu & Routing

> Source of truth: `src/app.js`, `src/routes/**`, `src/views/partials/header.ejs`. Update when routes/menus change.

## 대메뉴 ↔ 라우트 ↔ 접근
| 대메뉴(헤더) | 라우트 prefix | 라우트 파일 | 접근 |
|---|---|---|---|
| HOME | `/home` | `routes/home.js` | 로그인 필요 |
| 시작하기 | `/guide` | `routes/guide.js` | 로그인 필요 |
| API | `/api-reference` | `routes/apiReference.js` | 로그인 필요 |
| 운영 지원 | `/support` | `routes/support.js` | 로그인 필요 |
| 관리자 | `/admin` | `routes/admin.js` | admin 전용 |
| (로그인/신청) | `/auth` | `routes/auth.js` | 공개 |

## 엔드포인트 목록
### /auth (공개)
- `GET /auth/login`, `POST /auth/login`, `POST /auth/logout`
- `GET /auth/apply`, `POST /auth/apply`

### /home, /guide, /api-reference (isAuthenticated)
- `GET /home` · `GET /guide`
- `GET /api-reference` (쿼리 `?doc=<domain>`)

### /support (isAuthenticated)
- `GET /support`
- `GET /support/inquiry`, `POST /support/inquiry`
- `GET /support/firewall-apply`, `POST /support/firewall-apply`

### /admin (isAuthenticated + isAdmin)
- `GET /admin` → `/admin/partners`
- `GET /admin/partners`, `POST /admin/partners/:id/approve`, `POST /admin/partners/:id/reject`
- `GET /admin/firewall`, `POST /admin/firewall/:id/approve`, `POST /admin/firewall/:id/reject`, `POST /admin/firewall/:id/issue-token`
- `GET /admin/inquiries`, `POST /admin/inquiries`, `POST /admin/inquiries/:id/answer`, `POST /admin/inquiries/:id/toggle-faq`
- `GET /admin/notices`, `POST /admin/notices`, `POST /admin/notices/:id/update`, `POST /admin/notices/:id/delete`, `POST /admin/notices/:id/toggle-visible`

### 루트/에러
- `GET /` → 로그인 시 `/home`, 아니면 `/auth/login`
- 404 → `error/404`, 500 → `error/500`

## 헤더 메뉴 분기 (`partials/header.ejs`)
- `currentMenu` 값(`home|guide|api-reference|support|admin`)으로 active 탭 표시.
- `user.role === 'admin'`일 때만 "관리자" 탭 노출.
- 우측: 로그인 시 이름 + 로그아웃(POST), 미로그인 시 로그인 링크.
- 참고: API 탭 링크는 `/api-reference?doc=header`(존재하지 않는 domain → `specs[0]` 폴백) — **[Needs verification]**.
