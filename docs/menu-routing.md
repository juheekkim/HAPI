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
- `GET /admin/apis`(목록), `GET /admin/apis/new`(등록 폼), `GET /admin/apis/:id/edit`(수정 폼), `POST /admin/apis`(등록), `POST /admin/apis/:id/update`(수정), `POST /admin/apis/:id/delete`(삭제)
- `GET /admin/menus`(메뉴 관리), `POST /admin/menus`(등록), `POST /admin/menus/:id/update`, `POST /admin/menus/:id/delete`(하위 CASCADE), `POST /admin/menus/:id/toggle-active`
- `GET /admin/roles`(권한 그룹 관리), `POST /admin/roles`(등록), `POST /admin/roles/:id/update`, `POST /admin/roles/:id/delete`, `POST /admin/roles/:id/menus`(역할별 메뉴 매핑 저장)

### 루트/에러
- `GET /` → 로그인 시 `/home`, 아니면 `/auth/login`
- 404 → `error/404`, 500 → `error/500`

## 헤더 메뉴 분기 (`partials/header.ejs`)
- **상단 대메뉴는 로그인 role에 매핑된 메뉴만 동적 렌더링**한다(하드코딩 아님). `loadNavMenus` 미들웨어(`src/middlewares/loadNavMenus.js`, `app.js`에서 `res.locals.user` 주입 직후 전역 등록)가 `menuModel.getNavMenusByRole(user.role)`로 `role_menus`를 조회해 `res.locals.navMenus`에 주입 → 헤더가 이를 순회 렌더.
  - `getNavMenusByRole`: `menus`(parent_id IS NULL, `menu_type='nav'`, `is_active`) 중 해당 `roles.code`에 매핑된 것만. `admin_only` 메뉴(관리자)는 `role='admin'`에만 노출(방어적 가드).
  - 활성 탭 판별 키는 경로 첫 세그먼트(`/api-reference` → `api-reference`)로, 컨트롤러가 넘기는 `currentMenu`와 비교.
  - 매핑이 없거나 DB 오류 시 `navMenus=[]`(빈 네비). 각 role은 `/admin/roles`(권한 그룹 관리)에서 노출할 메뉴를 반드시 매핑해야 한다.
  - **한계(현 단계)**: 이건 **시각적 노출 제어**다. 라우트 접근 자체는 여전히 각 라우터의 `isAuthenticated`/`isAdmin`만으로 막는다. admin 서브탭은 아직 하드코딩(대메뉴·API 사이드바는 동적화됨).
- 우측: 로그인 시 이름 + 로그아웃(POST), 미로그인 시 로그인 링크.
- 참고: API 대메뉴 링크 path는 `/api-reference`(doc 미지정) — 컨트롤러가 role의 첫 허용 문서로 랜딩.

## 메뉴 데이터화 (진행 중)
- `menus` 테이블(`21`/`22` 스크립트)이 메뉴 구조(상단 nav + 관리자 서브탭 + apiReference 사이드바)를 계층(`parent_id`)으로 보유. `/admin/menus`에서 CRUD, `/admin/roles`에서 역할별 메뉴 매핑.
- **상단 대메뉴는 `role_menus` 기반 동적 렌더링 적용됨**(위 "헤더 메뉴 분기" 참조, `loadNavMenus` 미들웨어).
- **API Reference 좌측 사이드바도 `role_menus` 기반 동적 렌더링 적용됨(임의 depth 재귀)**:
  - `menuModel.getApiSidebarByRole(role)`가 API 대메뉴 하위 **서브트리를 임의 depth로 재귀 순회**하며 role에 매핑된 링크만 남긴다(노드 유지: path 있고 매핑됨 OR 살아남은 자식 있음). 반환은 중첩 트리 `[{name,icon,path,doc,isLink,children[]}]`.
  - `apiReference/index.ejs`가 재귀 파셜 `apiReference/_sidebarTree.ejs`로 depth 들여쓰기 렌더(`isLink`=링크, 아니면 그룹/비클릭 헤더). 즉 `공통 › 헤더 › 테스트`처럼 3단계+ 메뉴도 그대로 노출된다.
  - 시드 기본 계층은 API → 그룹(공통/리조트/에스테이트) → 문서지만(`24_restructure_api_menu_hierarchy.sql`), 렌더러는 깊이에 제약이 없다. 권한 매트릭스(`roles.ejs`)도 세로 트리로 표시되고 부모 체크 시 하위 자동 체크(cascade).
  - **랜딩/접근**: 컨트롤러가 사이드바 트리에서 `allowedDocs`를 **재귀 수집** → 쿼리 `?doc=`가 허용 목록에 없으면 첫 허용 문서로 `redirect`, 없으면 role의 첫 허용 문서로 랜딩. 권한 없는 문서 본문 노출을 막는다.
- **아직 하드코딩**: 관리자 `admin-tabs`(8개 뷰에 복붙). 동적화 시 `partials/admin-tabs.ejs` 추출 권장.
- **라우트 접근 제어**: 대메뉴/사이드바/문서 랜딩은 위처럼 제어되나, 일반 라우트(`/support` 등) 직접 URL 접근 차단은 여전히 `isAuthenticated`/`isAdmin` 수준 — `role_menus` 기반 전면 서버측 차단은 다음 범위 **[예정]**.
