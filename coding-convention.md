# 코딩 규칙 (Coding Convention)

HAPI 프로젝트의 **코드 품질·포맷팅 규칙**입니다. 모든 코드 작성·리뷰 시 이 규칙을 따릅니다.

---

## 0. 담당 영역 수정 원칙 ⚠️

> **작업 전 반드시 확인하세요. 본인 담당 영역 외 파일은 읽기 참조만 허용합니다.**

### 개발자별 수정 가능 파일 범위

| 개발자 | 수정 가능 경로 |
|---|---|
| **윤태윤** | `src/routes/home.js`, `src/controllers/homeController.js`, `src/views/home/**`, `src/models/home*`, `public/js/home/**`, `public/css/home/**` |
| **김주희** | `src/routes/guide.js`, `src/controllers/guideController.js`, `src/views/guide/**`, `src/models/guide*`, `public/js/guide/**`, `public/css/guide/**` |
| **박승욱** | `src/routes/apiReference.js`, `src/controllers/apiReferenceController.js`, `src/views/apiReference/**`, `src/models/apiReference*`, `public/js/api-reference/**`, `public/css/api-reference/**` |
| **김은성** | `src/routes/support.js`, `src/controllers/supportController.js`, `src/views/support/**`, `src/models/support*`, `public/js/support/**`, `public/css/support/**` |
| **임가윤** | `src/routes/admin.js`, `src/controllers/adminController.js`, `src/views/admin/**`, `src/models/admin*`, `src/middlewares/auth*.js`, `public/js/admin/**`, `public/css/admin/**` |

### 공통 영역 — 전원 협의 없이 단독 수정 금지

| 경로 | 설명 |
|---|---|
| `src/app.js` | 앱 진입점, 미들웨어·라우트 등록 |
| `src/config/**` | DB 커넥션, 환경설정 |
| `src/views/layouts/**` | 전체 페이지 레이아웃 |
| `src/views/partials/**` | 헤더, 사이드바, 브레드크럼 등 공통 UI |
| `public/js/common/**` | 공통 JS (apiClient 포함) |
| `public/css/common/**` | 공통 스타일 |
| `public/images/**` | 공용 이미지 |
| `db/scripts/**` | DB DDL/DML 스크립트 |
| `package.json`, `.env.example` | 의존성·환경 키 |

### 규칙 요약
1. **내 경로 외 파일은 열어보기만** — 참조는 허용, 저장은 금지
2. **공통 영역 변경 필요 시** — Slack/회의로 영향 범위 공유 후 전원 합의
3. **부득이하게 타인 영역 수정이 필요한 경우** — 해당 담당자에게 요청하거나 페어로 진행
4. **공통 컴포넌트에 기능 추가가 필요한 경우** — 담당자에게 요청하고 직접 수정하지 않음

---

## 1. 기본 방침: ESLint + Prettier 조합

- **ESLint**: 코드 품질 담당 — 미사용 변수, `===` 강제, 안티패턴 검출
- **Prettier**: 포맷팅 담당 — 들여쓰기, 세미콜론, 따옴표 스타일 통일
- **`eslint-config-prettier`** 로 두 도구의 충돌 방지 (포맷팅은 Prettier가 단독 담당)

---

## 2. 적용 범위

- `.js` 파일 전체: `src/**/*.js`, `public/js/**/*.js`
- EJS 파일(`.ejs`) 자체는 ESLint 대상 제외 — 단, EJS 내 `<script>` 로직은 `public/js/`로 분리해 적용

---

## 3. 패키지 설치

```bash
npm install -D eslint prettier eslint-config-prettier
```

---

## 4. 설정 파일 예시

### 4-1. ESLint (`.eslintrc.json`)

```json
{
  "env": {
    "node": true,
    "browser": true,
    "es2022": true
  },
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "extends": [
    "eslint:recommended",
    "prettier"
  ],
  "rules": {
    "no-unused-vars": "error",
    "eqeqeq": ["error", "always"],
    "no-var": "error",
    "prefer-const": "error",
    "no-console": "off"
  }
}
```

> `extends` 마지막에 `"prettier"` 를 두어 포맷팅 충돌 항목을 비활성화합니다.

### 4-2. Prettier (`.prettierrc.json`)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "es5",
  "endOfLine": "lf"
}
```

### 4-3. 무시 파일

`.eslintignore` / `.prettierignore` 공통:
```
node_modules/
dist/
public/vendor/
```
`.eslintignore`에 `**/*.ejs` 추가

---

## 5. 실행 스크립트 (`package.json`)

```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.js\" \"public/js/**/*.js\"",
    "lint:fix": "eslint \"src/**/*.js\" \"public/js/**/*.js\" --fix",
    "format": "prettier --write \"src/**/*.js\" \"public/js/**/*.js\"",
    "format:check": "prettier --check \"src/**/*.js\" \"public/js/**/*.js\""
  }
}
```

- 커밋 전 `npm run lint`와 `npm run format:check`로 점검합니다.
- 자동 수정은 `npm run lint:fix`, `npm run format`을 사용합니다.

---

## 6. 운영 권장 사항

- VS Code에 ESLint·Prettier 확장 설치 + `formatOnSave` 활성화 권장
- 커밋 훅(husky + lint-staged) 도입으로 커밋 시점 자동 검사 권장
- 규칙 변경 시 이 문서와 설정 파일을 함께 갱신하고 팀에 공유

---

## 7. 공통 레이아웃 관리

### 원칙
상단 헤더, 좌측 메뉴, 본문 영역 래퍼, 로그아웃 버튼, 현재 메뉴 하이라이트 등 **전체 페이지에 걸치는 UI**는 공통 영역(`views/layouts/`, `views/partials/`)에서 단독 관리합니다.

> ❌ **`views/layouts/`·`views/partials/` 하위 파일은 어떤 개발자도 단독으로 수정할 수 없습니다.**
> 변경이 필요하면 팀 전원 협의 후 진행하며, 변경 결과를 모든 팀원에게 공유합니다.

### 파일 구조
```
views/
├── layouts/
│   └── main.ejs          # 전체 페이지 껍데기 (head, header, aside, footer 포함)
└── partials/
    ├── header.ejs        # 상단 헤더 (로고, 사용자 정보, 로그아웃 버튼)
    ├── sidebar.ejs       # 좌측 메뉴 (권한에 따라 항목 표시/숨김)
    └── breadcrumb.ejs    # 현재 메뉴 위치 표시
```

### 현재 메뉴 표시 규칙
- 각 라우트 컨트롤러에서 `res.locals.currentMenu`에 메뉴 키를 할당합니다.
- `sidebar.ejs`에서 `currentMenu` 값을 비교해 활성 클래스(`active`)를 적용합니다.

```js
// 예: controllers/guideController.js
res.render('guide/overview', { currentMenu: 'guide' });
```

### 로그아웃
- 로그아웃 버튼은 `header.ejs` 내에 위치하며 `POST /auth/logout`으로 요청합니다.
- 각 개발자는 별도 로그아웃 버튼을 페이지에 추가하지 않습니다.

---

## 8. 프론트엔드 API 호출 규칙

### 표준: `fetch` API (브라우저 내장)
별도 라이브러리 없이 **브라우저 내장 `fetch`를 단일 표준**으로 사용합니다.
axios, jQuery.ajax 등 다른 방식은 사용하지 않습니다.

### 공통 클라이언트 래퍼
`public/js/common/apiClient.js`에 공통 래퍼를 정의하고, 모든 API 호출은 이 함수를 통해 수행합니다.
직접 `fetch()`를 호출하지 않습니다.

> ❌ **`public/js/common/apiClient.js`는 공통 영역입니다. 각 개발자가 임의로 수정하지 않습니다.**
> 기능 변경이 필요하면 팀 협의 후 반영하고 전원에게 공유합니다.

```js
// public/js/common/apiClient.js
const apiClient = {
  async request(method, url, data = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (data) options.body = JSON.stringify(data);

    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw { status: res.status, message: err.message || '요청 실패' };
    }
    return res.json();
  },
  get(url)         { return this.request('GET', url); },
  post(url, data)  { return this.request('POST', url, data); },
  put(url, data)   { return this.request('PUT', url, data); },
  delete(url)      { return this.request('DELETE', url); },
};
```

### 사용 예
```js
// 개별 페이지 JS에서
const data = await apiClient.get('/api/notices');
await apiClient.post('/api/inquiry', { title, content });
```

### 오류 처리
- `try/catch`로 감싸고, 사용자에게 에러 메시지를 표시합니다.
- 401 응답 시 로그인 페이지(`/auth/login`)로 리다이렉트합니다.

```js
try {
  const result = await apiClient.post('/api/inquiry', payload);
  // 성공 처리
} catch (err) {
  if (err.status === 401) location.href = '/auth/login';
  else alert(err.message);
}
```

---

## 9. 권한(Role) 기반 메뉴 분리

### 역할 정의
| 역할 | 값 (`role`) | 접근 가능 메뉴 |
|---|---|---|
| 일반 사용자 | `user` | HOME, 시작하기, API Reference, 운영 지원 |
| 관리자 | `admin` | 위 전체 + 관리자 |

### 세션에 역할 저장
로그인 성공 시 세션에 사용자 정보와 역할을 저장합니다.

```js
// 로그인 처리 예
req.session.user = { id: row.id, name: row.name, role: row.role };
```

### 사이드바 메뉴 표시/숨김
`sidebar.ejs`에서 세션 역할에 따라 관리자 메뉴를 조건부 렌더링합니다.

> ❌ **`sidebar.ejs` 수정은 공통 영역 변경에 해당합니다. 메뉴 항목 추가·제거 시 반드시 팀 협의를 거칩니다.**

```ejs
<% if (locals.user?.role === 'admin') { %>
  <li><a href="/admin">관리자</a></li>
<% } %>
```

### API 응답에서도 역할 검증
클라이언트 렌더링으로 메뉴를 숨기더라도, 서버 라우트에서 반드시 권한을 재검증합니다 (아래 인증 가드 참조).

---

## 10. 인증 가드 (Auth Guard)

### 미들웨어 위치
`src/middlewares/` 하위에 인증·권한 미들웨어를 두며, **임가윤** 담당입니다.

> ❌ **`src/middlewares/auth*.js`는 임가윤 단독 소유입니다. 다른 개발자는 절대 수정하지 않습니다.**
> 인증·권한 로직 변경이 필요하면 임가윤에게 요청합니다.

```
src/middlewares/
├── isAuthenticated.js   # 로그인 여부 검사
└── isAdmin.js           # 관리자 권한 검사
```

### 미들웨어 구현

```js
// src/middlewares/isAuthenticated.js
function isAuthenticated(req, res, next) {
  if (req.session?.user) return next();
  res.status(401).redirect('/auth/login');
}
module.exports = isAuthenticated;
```

```js
// src/middlewares/isAdmin.js
function isAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') return next();
  res.status(403).render('error/403');
}
module.exports = isAdmin;
```

### 라우트 적용 규칙

| 대상 라우트 | 적용 미들웨어 |
|---|---|
| 공개 페이지 (HOME, 시작하기, API Reference, 운영 지원) | 없음 |
| 로그인 필요 페이지 (문의하기, 방화벽 신청 등) | `isAuthenticated` |
| 관리자 전용 (`/admin/**`) | `isAuthenticated` → `isAdmin` |

```js
// 예: routes/admin.js
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAdmin = require('../middlewares/isAdmin');

router.use(isAuthenticated, isAdmin); // 모든 /admin 라우트에 일괄 적용
```

### 검증 원칙
1. **서버에서 항상 재검증** — 프론트에서 메뉴를 숨겨도 URL 직접 접근을 막을 수 없으므로, 라우트·컨트롤러에서 반드시 미들웨어를 거칩니다.
2. **최소 권한 원칙** — 필요한 역할만 접근 허용하고, 기본값은 차단입니다.
3. **에러 페이지 분리** — 미인증(401)은 로그인 리다이렉트, 권한 없음(403)은 별도 에러 페이지로 처리합니다.

---

## 11. 변경 이력

| 일자 | 변경 내용 | 작성자 |
|---|---|---|
