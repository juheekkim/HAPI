# Frontend — 상세 (EJS SSR)

> Source of truth: `src/views/**`, `src/public/**`, `src/app.js`. Update when views/assets change.

## 렌더링 스택
- EJS + `express-ejs-layouts`. 기본 레이아웃 `views/layouts/main.ejs`(`app.set('layout', 'layouts/main')`).
- `main.ejs`: `<head>`(폰트, `/css/common.css`) + `partials/header` + `page-wrapper` 안 `body` + `/js/common/apiClient.js` + 방화벽 비고 툴팁 마우스 추적 스크립트.
- 인증 화면(`auth/login.ejs`)은 `layout: false`로 단독 렌더.

## 뷰 구조
```
views/
├── layouts/main.ejs        # 공통 레이아웃 (공통 영역)
├── partials/header.ejs     # 상단 네비 (currentMenu, user 기반 분기; 공통 영역)
├── home/index.ejs
├── guide/index.ejs
├── apiReference/index.ejs  # ?doc=<domain> 스펙 뷰
├── support/{index,inquiry,firewall-apply}.ejs
├── admin/{partners,firewall,inquiries,notices}.ejs
├── auth/login.ejs          # 로그인 + 파트너 신청 (layout:false)
└── error/{403,404}.ejs     # 500은 app.js에서 render (파일 존재 확인 필요 [Needs verification])
```

## 렌더 규약 (controller → view)
- 모든 페이지에 `title`, `currentMenu` 전달. 헤더가 `currentMenu`로 active 탭, `user.role==='admin'`로 관리자 탭 노출.
- `res.locals.user`는 `app.js`에서 세션으로 주입 → 모든 뷰에서 사용 가능.
- 목록/폼 데이터는 컨트롤러가 명시 키로 전달(예: `partners`, `requests`, `notices`, `inquiries`, `applies`, `specs/selectedSpec/selectedDoc`, `myInquiries`, `success/error`).

## 클라이언트 스크립트
- `public/js/common/apiClient.js`: 유일한 fetch 래퍼(`get/post/put/delete`, JSON, `credentials: same-origin`). **직접 `fetch()` 호출 금지.**
- 현재 화면 상호작용 대부분은 폼 POST + 서버 렌더. 비동기 호출 추가 시 apiClient 경유.

## 스타일
- `public/css/common.css` 단일 공통 스타일(현재 영역별 css 분리는 미도입). 폰트: Noto Sans KR, JetBrains Mono.

## 규칙
- `views/layouts/**`, `views/partials/**`, `public/*/common*`는 공통 영역 → 팀 협의 후 변경.
- 화면/메뉴/포탈 분기 변경 시 `docs/modules.md`, `docs/business-rules.md` 동시 갱신.
- 담당 영역(뷰 하위 폴더) 준수(`team-ownership.md`).
