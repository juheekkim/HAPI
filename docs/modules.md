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
- 역할: 파트너사 승인/반려, 방화벽·토큰 요청 처리, 문의 답변/FAQ 토글, 공지 CRUD/노출 토글, **API 등록/관리**(API 명칭·설명 및 Request/Response 파라미터 수기 등록·수정·삭제), **메뉴 관리**(계층 메뉴 CRUD), **권한 그룹 관리**(역할 CRUD + 역할별 메뉴 매핑), **사용자별 권한관리**(파트너사 코드 ↔ 권한그룹 매핑).
- 위치: `routes/admin.js`(`isAuthenticated`+`isAdmin`) → `adminController.js` → `partnerModel`, `partnerFirewallApplyModel`, `firewallModel`, `userModel`, `inquiryModel`, `noticeModel`, `apiSpecModel`, `menuModel`, `roleModel` → `views/admin/{partners,firewall,inquiries,notices,apis,api-form,menus,roles,partnerRoles}.ejs`.
- 메뉴 관리 서브메뉴(`/admin/menus`): `menus` 테이블을 계층(`parent_id`) CRUD. `menuModel.getAllWithChildren()`로 트리 렌더, 삭제 시 하위 메뉴 CASCADE. 렌더링 동적화는 다음 이터레이션 예정(`docs/menu-routing.md` 참조).
  - **api-doc 경로 도우미**: 모달에서 유형을 `api-doc`로 선택하면 "API 문서 연결" UI가 노출된다. 컨트롤러 `menus()`가 `apiSpecModel.getAllForAdmin()`(실패 시 `[]` 폴백)로 등록된 API 목록을 `apiDocs`로 내려주고, 뷰(`menus.ejs`)는 **콤보박스(검색 입력창 + 팝오버 목록)**로 렌더한다(바닐라 JS, 외부 라이브러리 없음). 목록은 입력창 포커스/타이핑 시에만 `position:absolute` 팝오버로 떠서 겹쳐지고(모달 높이 항목 수와 무관하게 고정, 목록 자체는 `max-height` 스크롤), 선택·바깥 클릭 시 접힌다. 항목: 맨 위 `✏️ 직접 입력(커스텀 URL)` + 각 API 문서(`data-path="/api-reference?doc=<domain>"`, 라벨 `"<name> (<domain>)"`). 검색어는 명칭·도메인(`data-search`)으로 필터. 선택 시 입력창엔 선택 라벨이 표시된다. **동작(선택 시 잠금)**: API 문서를 선택하면 경로(`#menuPath`)에 base URL이 자동 입력되고 **읽기전용으로 잠금**(전체 URL 훼손 방지). 커스텀 URL이 필요하면 `직접 입력`을 골라 잠금 해제 후 전체 URL을 자유 입력. `api-doc`가 아닌 유형이거나 등록된 문서가 없으면 항상 자유 입력. 수정 모드는 기존 path가 등록 문서와 정확히 일치하면 그 항목을 pre-select(잠금), 아니면 `직접 입력`(편집). 저장값은 여전히 `menus.path` 자유입력 문자열 — **모델/컨트롤러 저장 로직·스키마 무변경**(연결 열쇠는 domain). 목적: `?doc=` 값 수기 입력에서 오던 오타/불일치 제거 + 선택 후 URL 훼손 차단.
- 권한 그룹 관리 서브메뉴(`/admin/roles`): `roles` 테이블 CRUD + `role_menus` 매핑. 역할별 체크박스 매트릭스에서 `POST /admin/roles/:id/menus` → `roleModel.setMenus`(트랜잭션 교체). `code UNIQUE` 위반은 `23505`로 잡아 폼 에러 배너 표시. `admin` 그룹은 활성 토글 UI 비활성화 + 컨트롤러에서 `is_active` 강제 `true`(전체 관리자 로그인 차단 방지).
- 사용자별 권한관리 서브메뉴(`/admin/partner-roles`, `27`): 승인된 파트너사 목록 + 권한그룹(ADMIN 제외) 셀렉트박스. 선택 시 `partners.role_id` 저장, 그룹명 셀 자동 갱신. 파트너 로그인 시 `loadNavMenus`/`apiReferenceController`가 이 매핑을 `users.role`보다 우선 적용해 실제 노출 메뉴를 결정(`partnerModel.getRoleCodeById`).
- API 등록/관리 서브메뉴(`/admin/apis`): `api_specs` 테이블을 CRUD. 목록은 `apiSpecModel.getAllForAdmin()`(STATIC fallback 없음, DB 실제 상태만 표시). 등록/수정 화면(`api-form.ejs`)은 엔드포인트(HTTP method/URL/설명/응답 예시)와 그 하위 Request 파라미터(파라미터명/타입/필수여부/설명)를 화면에서 동적으로 추가·삭제할 수 있는 폼을 제공하며, 제출 시 `endpoints` JSONB 배열로 직렬화되어 저장된다. 저장되는 구조는 API Reference가 읽는 `apiSpecModel.STATIC_SPECS`/`endpoints` 구조와 동일해 별도 변환 없이 API Reference 화면에 바로 노출된다.
  - **등록 방식 확장(뼈대)**: `/admin/apis/new` 화면(수정 모드 제외)에 "수기 작성 / 엑셀 업로드 / MCI 서비스 주소 가져오기" 3-way 탭을 추가했다(`api-form.ejs`). 세 방식 모두 같은 `ApiSpecInput` 형태(`{ category, domain, name, description, endpoints, displayOrder }`, 정의: `models/apiSpecImportMapper.js`)로 귀결되며, 엑셀/MCI 결과는 화면의 `applyImportedSpec(spec)` 함수(데이터 바인딩 슬롯)를 통해 기존 수기 작성 필드·엔드포인트 블록(`addEndpoint()`)에 그대로 주입된다 — 최종 저장은 항상 기존 `apiForm` 제출(`createApi`/`updateApi`) 경로 하나로만 이루어진다.
    - 엔드포인트: `POST /admin/apis/import/excel`(`adminController.importApisFromExcel`), `POST /admin/apis/import/mci`(`adminController.fetchApiFromMci`). 응답 계약: `{ success:true, specs: ApiSpecInput[] }` 또는 4xx/5xx + `{ success:false, message }`.
    - **엑셀 업로드 동작함**: `multer`(메모리 업로드, `routes/admin.js`) + `exceljs`(파싱)로 실제 파일을 처리한다. 프론트(`api-form.ejs`)는 `FormData`로 파일 바이트를 `apiClient.upload()`(신규 메서드, `apiClient.js`)를 통해 전송한다. 파싱 대상은 사내 표준 "HABIS 모델 정의서" 양식(워크북 1개 = API 1개, 시트명 `#1`/`#2`/`#3-1`...= 엔드포인트 1개, 시트 안에 `[INPUT]`/`[OUTPUT]` 필드 표)이며 매핑 로직은 `apiSpecImportMapper.mapHabisWorkbookToApiSpec`(컬럼은 위치가 아니라 헤더 문구로 탐색해 컬럼 순서 변화에 견딤). 이 양식엔 REST method/URL이 없어 `method`는 `POST` 고정, `url`엔 SVC ID를 넣는다. `사용여부`가 `NOT USE`인 필드도 실제로는 존재하는 걸로 보고(관찰된 실 사례에서 조회조건 그룹 필드가 전부 NOT USE였음 — "선택값" 의미로 추정) 제외하지 않고 설명에만 남긴다. `domain`은 등록 화면 입력창에 자동으로 채워지지 않는다 — `apiSpecImportMapper.suggestDomainName`이 업무설명에서 알아볼 수 있는 단어(한글 사전 매칭 + 영문 토큰, 최대 3개)를 짧은 약어로 PascalCase 이어붙인 값을 "추천값"으로만 계산하고, `api-form.ejs`가 입력창 아래 힌트로 보여준 뒤 관리자가 클릭해야 실제로 채워진다(도메인은 실제 서비스 식별자라 자동 확정하면 오등록 위험이 큼). 겹치면 어차피 `createApi`가 `23505`를 잡아 에러 배너로 알려준다. `category`는 문서만으로 신뢰성 있게 못 정해 `resort` 기본값을 두고 관리자가 검토 후 바꿔야 한다.
    - **이미지 업로드도 동작함**: 여러 장 업로드 가능(이미지 1장 = 엑셀의 `#N` 시트 1장 = 엔드포인트 1개라는 동일 전제). `multer`(`upload.array('files', 10)`) + Claude Vision(`@anthropic-ai/sdk`, `claude-opus-4-8`, `output_config.format`의 `json_schema`로 구조화 출력 강제)으로 이미지에서 SVC명/업무설명/[INPUT]·[OUTPUT] 필드 표를 추출한다. 추출 결과 shape을 엑셀 파싱 결과와 동일하게(`{depth,id,label,type,usage,length,decimal,default,isArray,note}`) 맞춰서 `apiSpecImportMapper.mapImageExtractionsToApiSpec`이 엑셀 경로와 같은 `buildEndpointFromFields`/`assembleApiSpecInput`을 공유— NOT USE 처리, 도메인 추천 로직이 두 경로에서 갈라지지 않는다. `ANTHROPIC_API_KEY`(.env, 공통 영역) 미설정 시 MCI 연동과 동일하게 501로 안내한다.
    - **MCI 조회는 `MCI_SERVICE_BASE_URL` 환경변수(.env, 공통 영역) 설정 시 동작**: 신규 의존성 없이 Node 내장 `fetch`로 호출한다. 응답 필드 매핑(`apiSpecImportMapper.mapMciResponseToApiSpec`)은 잠정 매핑이며 실제 MCI 응답 스키마는 `[Needs verification]`.
    - **주의**: 이 확장은 `api_specs` 저장 단계만 자동화한다. 등록된 API가 API Reference 사이드바에 노출되려면 위 "사이드바" 항목대로 `/admin/menus`(api-doc 메뉴 생성)와 `/admin/roles`(역할 매핑)가 **별도로** 필요하다 — 자동 연동 아님.
- **사이드바(갱신)**: `views/apiReference/index.ejs`의 좌측 사이드바는 `menus`(임의 depth 트리) + `role_menus`로 렌더링된다(`menuModel.getApiSidebarByRole(role)`가 API 서브트리를 재귀 순회, 재귀 파셜 `apiReference/_sidebarTree.ejs`). **표시 여부는 `api_specs`가 아니라 `menus`/`role_menus`가 결정**. `/admin/menus`에서 원하는 depth로 메뉴를 만들고(부모 지정) `/admin/roles`에서 매핑하면 그 계층 그대로 사이드바에 중첩 노출된다.
- **랜딩/접근(갱신)**: `apiReferenceController.index`가 `sidebar`에서 `allowedDocs`를 산출해, 허용되지 않은 `?doc=`는 첫 허용 문서로 리다이렉트하고 doc 미지정 시 role의 첫 허용 문서로 랜딩한다. 그래서 est_partner처럼 특정 문서만 부여된 role은 상단 API 클릭 시 자기 문서로 진입하고, 권한 없는 문서 본문 URL 접근도 차단된다. (본문 EJS 분기 자체는 `selectedDoc` 기준 하드코딩이나, 컨트롤러 리다이렉트로 허용 문서만 도달.)
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
