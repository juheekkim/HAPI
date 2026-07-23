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
| Chatbot | (우측 하단 위젯) | 공통 | 로그인 필요 |

## 모듈별 상세

### Home
- 역할: 포털 소개/랜딩. 퀵 가이드 4카드(코드발급·로그인+방화벽 신청→API 확인→개발 서버 테스트→시작하기 상세가이드, `guide`와 동일 순서로 정정)는 요약 티저이고 상세는 `/guide`로 유도(중복 최소화).
- 위치: `routes/home.js` → `controllers/homeController.js` → `views/home/index.ejs`. `apiSpecModel.getAll()`/`noticeModel.getVisible()`을 조회해 API 명세 총계·카테고리별(공통/리조트/에스테이트) 개수, 최근 공지 2건을 동적으로 렌더링(이전엔 "API 명세 총 28개" 등 하드코딩된 정적 텍스트였음).

### Guide (시작하기)
- 역할: API 연동 온보딩 절차(코드 발급·로그인+방화벽 신청(개발/운영 모두)→API 확인→개발 서버 테스트→운영 테스트) + 용어집(정적 콘텐츠). 방화벽은 온보딩 초반에 개발/운영 서버 모두 한 번에 신청하는 순서 — 마지막 단계가 아님(실제 운영 프로세스 기준, 코드 흐름상 순서 강제는 없음). 접속정보/헤더 필드 같은 기술 상세는 중복 보관하지 않고 API Reference로 링크만 건다(단일 소스 유지).
- 위치: `routes/guide.js` → `guideController.js` → `views/guide/index.ejs`. 모델 없음.
- "운영 전환 체크리스트": 운영서버 방화벽 해제 완료 + 고객번호/회원번호 등 기준정보 사전 등록 완료 + 운영 접속정보 실호출 테스트 정상 응답 확인, 3개 항목.
- "자주 쓰는 용어" 표(파트너사 코드/systemCode/INTF_ID/RECV_SVC_CD/MCI/방화벽 토큰)는 `docs/business-rules.md`·`header_fields` 설명에서 뽑았다. `MCI`는 실제 쓰임(대외채널 연동 백엔드)만 확인되고 정식 명칭/풀네임은 미확인 — **[Needs verification]**.

### API Reference
- 역할: API 스펙/엔드포인트/파라미터/응답 예시/에러 코드 조회. `?doc=<domain>`로 선택.
- 위치: `routes/apiReference.js` → `apiReferenceController.js` → `models/apiSpecModel.js` → `views/apiReference/index.ejs`.
- 데이터: `api_specs` 테이블. **DB 미연결/빈 테이블이면(행이 하나도 없어야 함) `apiSpecModel.STATIC_SPECS` 반환**(condo/golf/product/hlive/estate/estate-facility/error-codes/auth) — DB에 한 건이라도 있으면 도메인 무관하게 DB만 사용.
- **에러 코드 탭(`error-codes` 도메인, 갱신)**: `menus.id=18` "공통 > 에러 코드"가 가리키는 `api_specs.domain='error-codes'` 행이 DB에 없어(다른 도메인이 이미 DB에 있어 STATIC_SPECS로도 안 빠짐) 화면이 비어 있던 문제를 `36_seed_error_codes_spec.sql`로 해소. 표 컬럼을 실제 쓰이는 응답 메시지 코드 형식에 맞춰 코드/HTTP 상태/설명 → **메시지코드/메시지명/설명**(`error_codes[].{code,name,desc}`)으로 변경(`index.ejs`, `apiSpecModel.STATIC_SPECS`의 예시 데이터도 필드명 통일). 신규 코드는 db/scripts 대신 `/admin/codes`(아래 Admin 섹션 참고)에서 등록 가능.
- **공통 코드 탭(`common-codes` 도메인, 신규)**: `menus.id=75` "공통 > 공통 코드"(관리자 메뉴관리에서 새로 만든 메뉴)가 사이드바에 안 보이던 문제 — 이 프로젝트 사이드바는 "role_menus에 매핑된 메뉴만 노출"(opt-in) 모델이라 메뉴를 새로 만들어도 자동으로 어느 role에도 매핑되지 않는다(신규 role뿐 아니라 신규 메뉴도 마찬가지, `role_menus` 섹션 참고). 형제 메뉴(헤더/에러 코드)와 동일하게 `admin`+`BigCorp`에 매핑해 해소(role_menus INSERT, 이건 `/admin/roles` UI로도 할 수 있는 살아있는 설정이라 db/scripts화하지 않음). 화면 자체는 `api_specs`와 무관한 `common_codes` 테이블(`docs/db-schema.md` §`common_codes` 참고, `commonCodeModel.getAllGrouped()`)을 `header` 탭과 같은 방식으로 `selectedSpec` 분기 밖에서 독립 렌더링(`_commonCodeTable.ejs`, 대분류명/대분류 코드/세부 코드/코드 설명 4열, `system_info`와 동일한 그룹 rowspan 패턴). rowspan 그룹 표는 `subtle-grid` 대신 전용 `grouped-rowspan-grid` 클래스를 쓴다 — rowspan으로 셀이 생략된 행에서 `subtle-grid`의 `td+td` 세로선이 끊기고 `tr:nth-child` 줄무늬가 컬럼별로 어긋나 보이던 문제(`system_info`/`header_fields` "구분" 컬럼도 동일 결함) 때문에, 컬럼별 `border-right` 명시 + 그룹 단위 배경 교차(`.group-alt`, 그룹 인덱스로 계산)로 교체(`common.css`, `_commonCodeTable.ejs`/`_systemInfoTable.ejs`/`_headerFieldTable.ejs` 3곳 모두 적용).
- 기본 선택 `doc`는 컨트롤러 기본값 `'condo'`. 단, 헤더 링크는 `/api-reference?doc=header`로 존재하지 않는 domain이라 `specs[0]`으로 폴백됨 — **동작 확인 필요 [Needs verification]**.

### Support (운영 지원)
- 역할: 공지 조회, FAQ 조회, 문의 등록/내역, 방화벽·토큰 신청/내역.
- 위치: `routes/support.js` → `supportController.js` → `models/noticeModel.js`, `inquiryModel.js`, `partnerFirewallApplyModel.js` → `views/support/{index,inquiry,firewall-apply}.ejs`.
- 흐름: `/support`(공지+FAQ), `/support/inquiry`(내 문의), `/support/firewall-apply`(방화벽 신청).

### Admin (관리자)
- 역할: 파트너사 승인/반려, 방화벽·토큰 요청 처리, 문의 답변/FAQ 토글, 공지 CRUD/노출 토글, **API 등록/관리**(API 명칭·설명 및 Request/Response 파라미터 수기 등록·수정·삭제), **코드 관리**(공통 코드/에러 코드 CRUD), **메뉴 관리**(계층 메뉴 CRUD), **권한 그룹 관리**(역할 CRUD + 역할별 메뉴 매핑), **사용자별 권한관리**(파트너사 코드 ↔ 권한그룹 매핑).
- 위치: `routes/admin.js`(`isAuthenticated`+`isAdmin`) → `adminController.js` → `partnerModel`, `partnerFirewallApplyModel`, `firewallModel`, `userModel`, `inquiryModel`, `noticeModel`, `apiSpecModel`, `commonCodeModel`, `menuModel`, `roleModel` → `views/admin/{partners,firewall,inquiries,notices,apis,api-form,codes,menus,roles,partnerRoles}.ejs`.
- **코드 관리 서브메뉴(`/admin/codes`, 신규)**: API Reference "공통 코드"/"에러 코드" 화면이 읽는 데이터를 db/scripts 없이 등록·수정·삭제. 저장 위치가 서로 다른 두 데이터(공통 코드=`common_codes` 전용 테이블, 에러 코드=`api_specs.domain='error-codes'`의 `error_codes` JSONB)를 한 화면에서 헤더 문서(전문구조/헤더정보)와 같은 클라이언트 탭 전환(`switchCodeTab`)으로 오간다. 공통 코드는 `id` 기준 개별 행 CRUD(`commonCodeModel.create/update/delete`, 그룹명·그룹코드·세부코드·설명·정렬순서 5필드), 에러 코드는 `code`를 키로 CRUD(`apiSpecModel.addErrorCode/updateErrorCode/deleteErrorCode` — JSONB엔 DB UNIQUE 제약을 걸 수 없어 컨트롤러가 기존 배열을 조회해 중복 `code`를 애플리케이션 레벨로 검증, `roles`의 `23505` 처리와 동일한 에러 배너 패턴). 에러 코드 대상 `api_specs` 행이 없으면 최초 등록 시 자동 생성.
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
- **엔드포인트 아코디언 상단 URL 표시(갱신)**: SVC-ID 스타일 엔드포인트(`ep.url`이 `/`로 시작하지 않음)는 `ep.url`이 실제 호출 경로가 아니라 `RECV_SVC_CD`/`INTF_ID`에 들어가는 서비스 코드값이라, `POST {ep.url}`을 URL처럼 한 줄로 보여주면 실제 호출 URL(헤더 문서의 고정 게이트웨이 주소)과 혼동된다는 피드백으로 두 줄로 분리했다: ①`POST .../iGate/{시스템코드}/json.jdo`(고정, `ep.description`의 `"{시스템코드} / ..."` 첫 토큰 사용) + "접속정보 ›" 링크(헤더 문서로, 툴팁으로 부연) ②`RECV_SVC_CD` 배지 + `ep.url` 값만 표시(INTF_ID 조합 규칙은 테스트 샌드박스에서 실제 계산되어 보이므로 여기선 생략). 화면 문구는 짧게, 상세 설명은 title 툴팁으로 이동. REST 경로 스타일(`ep.url`이 `/`로 시작) 엔드포인트는 기존 방식(`POST {ep.url}`) 그대로 유지.
- **"테스트" 샌드박스(신규)**: 각 엔드포인트 아코디언 헤더에 🧪 테스트 버튼(`index.ejs`) → 팝업(구조화 보기/Raw JSON 토글)에서 파라미터를 채워 `POST /api-reference/try`(`apiReferenceController.tryEndpoint`)로 실제 백엔드(`SANDBOX_GATEWAY_BASE_URL` + `systemCode`, env+요청별)에 프록시 호출한다. **`ep.url`이 `/`로 시작하지 않는(HABIS 엑셀/이미지 자동입력의 SVC-ID 스타일) 엔드포인트만 지원** — condo/golf/product/hlive/estate/estate-facility/auth 같은 `apiSpecModel.STATIC_SPECS`의 REST 경로 스타일(`url`이 `/api/v1/...`)은 실제 게이트웨이 매핑이 확인되지 않아 버튼이 노출되지 않는다 **[Needs verification: 레거시 REST 스타일 스펙의 실제 호출 대상]**.
  - 인가: 버튼 노출 여부(클라이언트)와 별개로, `tryEndpoint`가 `resolveAllowedDocs(sessionUser)`(→ `index`와 공유하는 `allowedDocs` 산출 헬퍼)로 요청받은 `domain`을 서버에서 재검증한다. 파트너는 `partners.role_id` 매핑이 세션 role보다 우선 적용되는 기존 규칙 그대로 따른다.
  - 요청 본문 구조(확인됨): 최상위 `{ SystemHeader, TransactionHeader, MessageHeader, Data }`. 헤더 3영역 필드값은 `header_fields.setting_type`/`setting_value`/`required_request` 메타데이터로 자동입력(규칙은 `docs/business-rules.md` 참고), `Data`는 `ep.params` 전체를 입력 필드로 노출하고(스펙상 `required` 여부에 따라 "필수 입력"/"선택" 배지로 구분) 파라미터명의 점(`.`) 접두사(`ds_inSearch.CORP_CD` 등)를 `Data.ds_inSearch = [ {...} ]`처럼 배열로 그룹핑한다. 자동 조립은 기본값일 뿐이며 실행 전 항상 사용자가 수정 가능(Raw JSON 뷰). 응답은 `SystemHeader`/`TransactionHeader` 포함 여부와 `MessageHeader.MSG_PRCS_RSLT_CD`로 정상/비즈니스 오류/형식 오류를 구분해 안내한다(`docs/business-rules.md` §10).
  - 호출 URL의 시스템코드(`systemCode`, 예: `OCH`/`LCB`)는 API마다 다르다 — `ep.description`이 `"{시스템코드} / ..."` 형식이라는 관찰된 규칙으로 첫 토큰을 추천값으로 채우고(모달의 "시스템코드" 입력칸, 편집 가능), 서버가 `^[A-Za-z0-9_-]{1,20}$`로 형식을 강제한다.
  - 클라이언트는 게이트웨이 host를 지정할 수 없다(SSRF 방지, `SANDBOX_GATEWAY_BASE_URL`은 서버 env 고정). `SANDBOX_GATEWAY_BASE_URL` 미설정 시 501.
- **헤더 문서 "전문구조" 탭(갱신)**: `?doc=header`의 첫 번째 탭. 이전에는 "시스템 정보"/"접속정보"가 `index.ejs`에 `LCB` 한 건만 하드코딩돼 있었으나(신규 시스템 코드가 운영 중 계속 추가되는 구조라 정적 데이터로는 유지 불가), `system_info` 테이블(`db/db-schema.md` 참고, `systemInfoModel.getAllGrouped()`)로 이전해 화면은 DB 조회 결과를 그대로 렌더링한다(`_systemInfoTable.ejs`). 신규 시스템은 관리자 UI 없이 `db/scripts/`에 새 번호 스크립트로 INSERT해 추가한다.
  - 접속정보 URL도 `.../iGate/LCB/json.jdo` 고정값 대신 `.../iGate/{시스템코드}/json.jdo` 플레이스홀더로 표시하고, 실제 값은 시스템 정보 표를 참고하도록 안내한다(`systemCode`가 API마다 다르다는 §55/§56 규칙과 동일 맥락).
  - "전문 예시" 섹션(신규): 헤더 3영역(`SystemHeader`/`TransactionHeader`/`MessageHeader`)에 대해 "테스트" 샌드박스와 동일한 `buildHeaderSection()`/`computeHeaderDefault()` 로직(클라이언트 JS, 로직 중복 없이 재사용)을 실행해 실제 요청 전문 예시를 `<pre class="code-block">`로 보여준다. `Data`부는 API마다 달라 안내 문구만 표시.
- **엔드포인트 상세(요청 파라미터/응답 예시/Data부 샘플, 갱신)**: 모든 API 문서의 엔드포인트 아코디언 공통 구조(`index.ejs`, `selectedSpec.endpoints.forEach`라 전 도메인에 자동 적용). 예전엔 "요청 파라미터"/"응답 예시"가 버튼 탭 전환(`switchTab`)으로 하나씩만 보였고 응답 예시는 raw JSON 텍스트였으나, 지금은 버튼 없이 한 화면에 순서대로 나열된다:
  1. 요청 파라미터 — 파라미터ID/파라미터명/Data type/필수/설명 표.
  2. 응답 예시 — 요청 파라미터 표(파라미터ID/파라미터명/Data type/필수/설명, 14%/18%/10%/10%/auto)와 컬럼 수·순서(마지막 칸이 설명)·모든 칸의 폭(인라인 `style="width:...%"`)을 동일하게 맞춘 표(필드ID/필드명/Data type/예시 값/설명)로 통일. `ep.responseExample`은 필드별 라벨·설명 메타데이터 없이 JSON 텍스트만 저장돼 있어(엑셀/이미지 자동입력이 OUTPUT 필드를 예시 JSON으로만 남김, `apiSpecImportMapper.buildResponseExampleObject`) "필드명"/"설명" 칸은 항상 빈 값이지만 칸 자체는 유지한다. 클라이언트 JS(`buildResponseRows`/`renderResponseTable`)가 파싱해 재귀 순회한다(값이 JSON이 아니면 "표로 변환할 수 없습니다" 안내, colspan 5).
  - **그룹(데이터셋) 트리 렌더링(갱신)**: 파라미터명이 `ds_inSearch.CORP_CD`처럼 점 표기라 평면 나열하면 실제로는 `ds_inSearch`라는 데이터셋(배열) 안에 `CORP_CD`가 들어있는 중첩 구조라는 게 잘 안 보인다는 피드백으로, 요청·응답 표 모두 점 경로를 그룹/리프 트리로 묶어 들여쓰기로 렌더링한다. 요청 쪽은 `buildParamTree`(점 경로 임의 depth 지원, `apiSpecImportMapper.buildParams`가 Group `▷` 들여쓰기를 그대로 점 경로에 반영하므로)+`renderParamTreeRows`, 응답 쪽은 파싱된 JSON을 그대로 재귀 순회하는 `buildResponseRows`가 담당하고, 그룹 헤더 행은 두 표가 공통으로 쓰는 `makeGroupRow`로 렌더링한다(파란 배지 + 들여쓰기). 이 포털의 Data 봉투 규칙(`docs/business-rules.md` §10)상 점 표기 접두사는 항상 배열로 감싸지므로 요청 쪽 그룹은 항상 "배열" 배지, 응답 쪽은 실제 JSON 값이 배열이면 "배열", 순수 객체면 "객체"로 표기한다.
  3. Data부 JSON 샘플 — 위 두 표는 필드 단위 나열이라 실제 전송/응답 봉투 모양(접두사 그룹이 배열로 감싸지는 형태 등)이 한눈에 안 보여 하단에 별도로 추가. 실제 게이트웨이 봉투는 요청/응답 모두 최상위 키가 `Data`인 형태(`docs/business-rules.md` §10)라 두 샘플 모두 `{ "Data": {...} }`로 통일해서 감싼다. 요청 쪽은 테스트 샌드박스와 동일한 `buildDataSection()`을 재사용(로직 중복 없음), 응답 쪽은 `renderResponseTable`이 이미 파싱한 결과를 재사용해 `{ Data: <파싱된 responseExample> }`로 감싸 보여준다(JSON 파싱 실패 시엔 원문 그대로). 요청 파라미터가 없거나 응답 예시가 없으면 해당 한쪽만 1열로 표시.
  - `ep.params`가 비어 있어도 `ep.responseExample`만 있으면 응답 표가 보이도록 두 조건을 독립적으로 분리(예전엔 파라미터가 있을 때만 응답 예시 블록이 렌더링되는 제약이 있었음).

### Auth
- 역할: 로그인/로그아웃, 파트너사 코드 신청.
- 위치: `routes/auth.js` → `authController.js` → `userModel`, `partnerModel` → `views/auth/login.ejs`(`layout:false`).

### Chatbot (공통 위젯)
- 역할: 로그인한 모든 페이지 우측 하단 아이콘 → 대화 패널. OpenAI function calling으로 `hapi_db` 데이터와 포털 정적 콘텐츠(공지/FAQ/API 문서/공통코드/에러코드/시스템정보/헤더필드/가이드)를 조회해 답하고, 로그인 사용자 본인의 문의·방화벽 신청 현황도 세션 범위로 조회 가능. 특정 개발자 소유가 아닌 레이아웃/파셜과 동일한 **공통 영역**(`team-ownership.md` §3).
- 위치: `routes/chatbot.js`(`isAuthenticated` 일괄 적용) → `chatbotController.js` → `chatbotModel.js`(대화 이력 CRUD + 기존 모델 재사용 컨텍스트 헬퍼) → `views/partials/chatbot.ejs`(레이아웃에 공통 포함) + `public/js/common/chatbot.js` + `public/css/chatbot.css`.
- 대화 이력은 `chatbot_messages` 테이블(`42`)에 사용자당 단일 스레드로 영구 저장 — 페이지 이동/재접속에도 이어짐. 상세(Tools 목록, 보안 범위, 환경변수, 아이콘 교체 방법)는 `docs/chatbot.md` 참고.
- UI 갱신: 패널 기본 크기를 `440x680`으로 확장했고(모바일은 뷰포트 제한), assistant 답변은 markdown/코드 블록/JSON 트리 뷰어로 구조화해 표시한다. API 질의에서는 답변 하단에 "API 문서 트리"(문서→상세 API→요청/응답 필드)를 제공하며, LLM 통신 trace(Request/Response/Tool Calls) 패널은 운영 사용자 화면에서 숨긴다.
- 추가 UX: 챗봇 답변 내 API/헤더/필드 언급 텍스트를 클릭하면 챗봇창을 유지한 채 API Reference로 즉시 점프한다. 이동은 본문 영역 비동기 교체 + 히스토리 pushState 기반이며, 도착지에서 탭/아코디언 자동 펼침과 위치 강조를 수행한다.

### AI 어시스턴트 (실험 기능)
- 역할: `/assistant` 전용 대메뉴 — 로그인 사용자 맞춤 추천(역할별 API 문서 카드/추천 질문 칩/내 지원 현황/공지)과 풀페이지 AI 대화. 링크 클릭 시 배경 이동 대신 **우측 문서 패널**에 API Reference 부분화면을 주입해 표시.
- 위치: `routes/assistant.js` → `assistantController.js` → `views/assistant/index.ejs` + `public/js/assistant.js` + `public/css/assistant.css`. 백엔드 대화 API는 신설 없이 기존 `/chatbot/*` 재사용, 답변 렌더는 `chatbot.js`가 노출한 `window.HapiChatbotShared` 재사용. 상세는 `docs/assistant.md`.

## 모듈 간 의존성 / 분기
- 공통: 세션(`res.locals.user`), 헤더 partial(`currentMenu`, admin 노출 분기), `apiClient.js`.
- Admin 승인 → `partners.partner_code` 채번 + `users` 계정 생성 → 파트너 로그인 → Support/API 이용.
- Admin 방화벽 승인 → `partner_firewall_applies.token` 채번 → 파트너가 Support에서 확인.
- 포털 분기: 관리자/파트너 역할에 따라 헤더 메뉴(관리자 탭)만 분기. 별도 포탈 URL 분리는 없음.

## 방화벽 모듈 주의 (중요)
방화벽 관련 **두 개의 테이블/모델**이 공존한다:
- `partner_firewall_applies` + `partnerFirewallApplyModel` — Support 신청 화면과 Admin 목록/승인/반려에서 실제 사용.
- `firewall_requests` + `firewallModel` — 구형/데모용. Admin `issueToken`이 `firewallModel.issueToken(id)`를 호출하는데, 목록은 `partner_firewall_applies` 기준이라 **id 대상 테이블 불일치 가능성**. → **[Needs verification]** (docs/backend.md, docs/db-schema.md 참조).
