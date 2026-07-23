# Business Rules — 업무 규칙

> Source of truth: `src/controllers/**`, `src/models/**`, `src/middlewares/**`. 확인된 사실과 추측을 구분한다. 추측은 **[Needs verification]**.

## 1. 사용자 / 권한
- 역할(role): `admin`(내부 담당자), `BigCorp`(연동사 담당자, 舊 `partner` — `26_rename_partner_role_to_bigcorp.sql`로 개명). 스키마 기본값은 `user`이나 실제 삽입값은 위 둘.
- 세션 로그인(`express-session`). 로그인 성공 시 `req.session.user = { id, name, role, partnerId }`.
- 접근 제어:
  - `auth/*`(로그인, 파트너 신청)만 공개.
  - `home`, `guide`, `api-reference`, `support`는 로그인 필요(`isAuthenticated`).
  - `admin/*`는 `isAuthenticated` + `isAdmin`(role === 'admin'). 미인증 → `/auth/login` 리다이렉트, 권한 없음 → 403.
- `/` 접근 시 로그인돼 있으면 `/home`, 아니면 `/auth/login`.
- 역할/메뉴 관리(`/admin/roles`, `/admin/menus`, admin 전용):
  - `roles.code`는 유일값. 중복 등록/수정 시 `23505`를 잡아 폼 상단 에러 배너로 안내(조용히 무시하지 않음).
  - 메뉴 삭제 시 하위 메뉴는 FK CASCADE로 함께 삭제(UI에서 confirm 경고).
  - 메뉴 노출은 **opt-in**: 로그인 role의 `role_menus`에 매핑된 메뉴만 상단 대메뉴/ API 사이드바에 노출된다(매핑 없으면 안 보임). `admin`=전체 매핑(`22`), `BigCorp`(舊 `partner`)=`admin_only=false` 전체 매핑(`23`, 관리자 제외 전체). 새 role은 `/admin/roles`에서 매핑해야 보인다.
  - 권한 그룹 관리 매트릭스는 부모 체크 시 하위 메뉴가 자동 선택/해제된다(개별 조정 가능).
  - 역할별 메뉴 매핑 저장은 기존 매핑을 통째로 교체(트랜잭션).
  - **사용자별 권한관리**(`/admin/partner-roles`, admin 전용, `28`): 파트너사(코드)마다 권한그룹 1개를 지정하면(`partners.role_id`) 그 파트너 로그인 사용자에게 실제로 해당 그룹의 메뉴만 노출된다(`users.role` 문자열보다 우선 적용). 그룹 미지정 시 `users.role`(현재 `BigCorp`)로 폴백. 관리자(admin) 개별 사용자 단위 매핑은 아직 없음 — 다음 이터레이션 **[예정]**.

## 2. 파트너사 온보딩 (확정 흐름)
1. 파트너가 `/auth/apply`로 신청 → `partners` 저장(`status='pending'`).
2. 관리자가 `/admin/partners`에서 승인/반려.
   - 승인: `partner_code` = 8자리 숫자 난수 채번 → `partners.status='approved'` + code 저장. 이어서 로그인 계정 생성: `users(username=code, password=bcrypt(code), role='BigCorp', partner_id)`. **초기 비밀번호 = partner_code.**
   - 반려: `status='rejected'` + `reject_reason` 저장(계정 미생성).
3. 파트너 로그인: 아이디 = `partner_code`, 비밀번호 = 초기값(code).

> 규칙 확인 필요: 이메일 통지("이메일로 안내드립니다") 문구는 UI에 있으나 **메일 발송 로직은 코드에 없음** → **[Needs verification]**.

## 3. 방화벽 / 토큰 신청 (확정 흐름 + 이슈)
- 파트너가 `/support/firewall-apply`에서 신청 → `partner_firewall_applies` 저장(`approval_status='pending'`, `dest_port` 기본 `'443'`).
- 관리자가 `/admin/firewall`에서 처리:
  - 승인: `approval_status='approved'`, `token='HWR'+8자리 난수`, `approved_at=now()`.
  - 반려: `approval_status='rejected'`, `reject_reason`.
- **이슈**: `/admin/firewall/:id/issue-token`은 `firewallModel.issueToken`(→ `firewall_requests`)을 호출하나, 목록/승인은 `partner_firewall_applies` 기준. 두 테이블이 달라 토큰 발급이 엉뚱한 레코드를 건드릴 수 있음 → **정리 필요 [Needs verification]**.

## 4. 공지사항
- 관리자: 등록/수정/삭제/노출 토글(`is_visible`). `tag_type` ∈ `new|notice|update`.
- 사용자(Support): `is_visible=true` 공지만 조회(`getVisible`). DB 오류 시 STATIC_NOTICES 폴백.

## 5. 문의 / FAQ
- 파트너: `/support/inquiry`에서 질문 등록(`status='pending'`), 본인 문의 내역 조회(`getByUserId`).
- 관리자: 답변(`answer`+`status='answered'`+`answered_at`), FAQ 토글(`is_faq`), 관리자 직접 등록(`createByAdmin`).
- Support 공개 FAQ: `is_faq=true AND status='answered'`만 노출(`getFaqs`).

## 6. API Reference 조회
- 전 파트너/관리자 조회 가능(로그인 필요). `?doc=<domain>`으로 스펙 선택, 없으면 `specs[0]`.
- 데이터 소스: `api_specs`(있으면) 아니면 STATIC_SPECS.

## 7. API 스펙 등록/관리 (Admin)
- 관리자는 `/admin/apis`에서 `api_specs`를 직접 CRUD한다(카테고리/도메인 코드/명칭/설명 + 엔드포인트별 Request 파라미터/Response 예시).
- `domain`은 `UNIQUE` 제약이 있어 중복 등록 시 폼으로 되돌아가 에러 메시지를 보여준다(다른 admin 모듈과 달리 실패를 조용히 무시하지 않음).
- **중요**: `apiSpecModel.getAll()`(API Reference가 사용)은 `api_specs`에 **1건이라도 저장되어 있으면 STATIC_SPECS 폴백을 더 이상 반환하지 않는다.** 즉 관리자가 API를 처음 등록하는 순간부터 기존 데모용 STATIC_SPECS 화면은 보이지 않게 되고 DB에 등록된 내용만 노출된다.
- 등록된 API는 API Reference 화면(`/api-reference?doc=<domain>`)에서 바로 조회 가능하나, 좌측 사이드바는 하드코딩된 domain 목록이라 새 domain이 자동으로 사이드바에 추가되지는 않는다 — **[Needs verification: 사이드바 동적화 필요 여부]**.
- **파라미터ID의 점(.) 표기 = Data 배열 그룹핑(요청, 갱신)**: "수기 작성" 파라미터 입력칸(`파라미터ID`)에 `ds_inSearch.CORP_CD`처럼 점을 포함해 입력하면 API Reference 테스트 샌드박스(§10)와 동일한 규칙으로 `Data.ds_inSearch = [ {...} ]` 배열로 그룹핑된다 — 별도 UI(그룹 선택 등) 없이 파라미터ID 값 자체가 그룹 지정 수단이다. `api-form.ejs`는 각 엔드포인트 블록에 이 규칙을 그대로 재현한 "Data 봉투 미리보기"(읽기전용, 파라미터ID 입력 시 실시간 갱신)를 제공해 관리자가 저장 전 실제 전송 봉투 모양을 확인할 수 있다.
- **응답 예시도 요청 파라미터와 동일한 필드 표로 관리(요청, 신규)**: 기존엔 응답 예시가 raw JSON textarea 하나였으나, `api-form.ejs`가 요청 파라미터와 동일한 구조(필드ID/필드명/Data Type/예시 값/설명)의 표로 대체했다. 필드ID에 점 표기(예: `ds_prcsResult.PROC_CD`)를 쓰면 요청과 동일하게 `{ "ds_prcsResult": [ {...} ] }` 배열로 그룹핑되어 저장된다(응답 예시 JSON 자체엔 상위 `Data` 키를 씌우지 않는다 — 기존 `ep.responseExample` 저장 형식과 동일, API Reference 읽기 화면이 표시할 때만 `{ Data: ... }`로 감싼다). "예시 값" 칸이 비어 있으면 `null`로 저장된다(§10 null 규칙과 통일). Data Type이 `Number`/`Integer`면 숫자로, `Boolean`이면 불리언으로 변환해 저장(문자열 "0"/"true"로 남지 않도록).
  - **수정 모드 역변환**: 기존에 저장된 `responseExample`(JSON 문자열)을 열면 `flattenResponseExampleToFields`가 위 규칙의 역으로 필드 표를 자동 생성한다. 배열이 아닌 중첩 객체 등 이 규칙에 맞지 않는 예전 데이터(예: STATIC_SPECS 유래 `condo` 도메인의 `{ resultCode, resultMsg, data: {...} }`)는 값 손실 없이 해당 값을 JSON 문자열 그대로 한 행("예시 값" 칸)에 보존한다 — 필드명/설명은 응답 예시에 원래 메타데이터가 없어 항상 빈 칸(기존 규칙과 동일).

## 8. 예외 / 에지 케이스
- DB 미연결·쿼리 오류: 다수 조회 모델이 STATIC fallback 반환하고 화면은 정상 렌더(에러 숨김) → 운영 시 오해 소지, 로깅만 수행.
- 입력 검증: 로그인은 빈값 체크. 그 외 폼(신청/문의/방화벽)은 서버측 강한 검증이 약함 → 보강 대상 **[Needs verification]**.
- 파트너 중복 신청/재승인 방지 규칙: 코드에 명시 없음 **[Needs verification]**.

## 9. 시스템 이동 조건 (메뉴 분기)
- 헤더 메뉴는 로그인 사용자 공통, `role==='admin'`일 때만 "관리자" 탭 노출.
- 별도 포탈(파트너 전용/관리자 전용) URL 분리는 없고 단일 포털에서 권한으로 분기. 세부는 `docs/menu-routing.md`.

## 9-1. 챗봇 표시 규칙(UI)
- 챗봇 패널 기본 크기는 데스크톱 `440x680`(모바일은 뷰포트 기반 축소)이며, 대화 가독성을 위해 assistant 출력은 markdown + 코드 블록 + JSON 트리 뷰어 형태로 구조화한다.
- 일반 질의는 텍스트 중심으로 표시하고, API 질의는 답변 하단에 "API 문서 트리"(문서→상세 API→요청/응답 필드)를 함께 표시한다.
- LLM 통신 과정의 trace(Request/Response/Tool Calls) JSON은 운영 사용자 화면에 노출하지 않는다.
- `apiDocs`/trace 데이터는 `/chatbot/message` 응답에만 포함되는 현재 턴 정보이며, `chatbot_messages` 원문에는 저장하지 않는다(이력 조회 시 assistant 텍스트 원문만 복원).
- 챗봇 응답에서 API 문서/헤더/필드로 매핑 가능한 텍스트를 클릭하면 챗봇창을 닫지 않고(열림/스크롤/입력중 상태 유지) API Reference 목표 위치로 이동한다. 이동 후 관련 탭/아코디언은 자동으로 펼치고 대상 섹션/행을 강조 표시한다.

## 10. API Reference "테스트" 샌드박스
- 대상: `api_specs.endpoints[].url`이 `/`로 시작하지 않는 엔드포인트만(HABIS 엑셀/이미지 자동입력으로 등록된 SVC-ID 스타일). `url`이 `/api/v1/...` 같은 REST 경로인 레거시/수기 스펙(STATIC_SPECS 계열)은 실제 호출 대상이 확인되지 않아 버튼 자체가 노출되지 않는다.
- 흐름: `index.ejs`의 🧪 테스트 버튼 → 팝업에서 파라미터 확인/수정 → `POST /api-reference/try`(`isAuthenticated`만 적용, admin 전용 아님 — 파트너도 자신에게 매핑된 문서는 사용 가능) → 서버가 게이트웨이로 프록시 호출 후 결과를 그대로 반환.
- **호출 URL**: `{SANDBOX_GATEWAY_BASE_URL}/{systemCode}/json.jdo`(env `SANDBOX_GATEWAY_BASE_URL` + 요청별 `systemCode`). `systemCode`(예: `OCH`, `LCB`)는 API마다 다르며, `ep.description`이 `"{시스템코드} / {서브메뉴} / {기능명}"` 형식(예: `"OCH / KIOSK / 예약정보 조회"`)이라는 관찰된 규칙에 따라 첫 토큰을 추천값으로 모달에 채우고 실행 전 사용자가 확인/수정한다. 서버는 `^[A-Za-z0-9_-]{1,20}$`로 형식을 강제해 경로 조작을 차단한다.
- **인가 재검증(중요)**: 버튼이 안 보이는 것과 별개로, `tryEndpoint`는 요청받은 `domain`이 세션(파트너는 `partners.role_id` 매핑 우선)의 `allowedDocs`에 포함되는지 서버에서 다시 검사한다. 미포함 시 403 — 파트너가 다른 파트너/미매핑 문서를 직접 API 호출로 조회하는 경로를 차단한다.
- **요청 봉투 구조(확인됨)**: 최상위 4개 키 `{ SystemHeader, TransactionHeader, MessageHeader, Data }`. `Data`는 `ep.params`의 이름 접두사(예: `ds_inSearch`)를 키로 하는 **배열**(예: `Data.ds_inSearch = [ { CORP_CD: ..., BRCH_CD: ... } ]`); 접두사(점) 없는 파라미터는 `Data` 바로 아래에 값으로 위치.
- 공통헤더(System/Transaction/Message) 자동입력 규칙(`header_fields` 재사용, 클라이언트 JS `computeHeaderDefault`/`buildHeaderSection`에서 계산 — 각 섹션의 모든 필드를 채우고 값 없는 항목도 키는 유지):
  1. `required_request === '×'`(요청측 미생성) → 키는 유지하고 값은 `null`(실제 관측 예시에서 `MessageHeader.MSG_PRCS_RSLT_CD: null` 등으로 확인).
  2. `setting_type === 'fix'` → `setting_value` 그대로 사용(값을 추측하지 않고 DB에 저장된 값 그대로).
  3. `setting_type === 'variable'`(서비스/호출마다 달라질 수 있음, 예: 전문일련번호·타임스탬프 등) → 아래 §자동 계산 대상(`HEADER_AUTO_COMPUTE`)에 없으면 자동으로 채우지 않고 `null`(요청, 빈 문자열 `""` 아님), 사용자가 반드시 직접 입력해야 함.
  4. 그 외(`setting_type === 'none'`, 예: `CMP_NO`/`BRANCH_NO`/`SCREEN_ID`) → `null`이지만 비워둬도 되는 선택 항목.
  5. **예외(잠금, `setting_type`과 무관)**: `RECV_SVC_CD`(수신서비스코드)는 테스트 대상 엔드포인트의 `ep.url`(SVC ID, 예: `HBSGOLOCH0119`)을 그대로, `INTF_ID`(인터페이스ID)는 `{systemCode}00{ep.url}`(예: `OCH00HBSGOLOCH0119`)을 자동 산출해 넣고 두 필드 모두 읽기전용으로 잠근다(`index.ejs` `makeFieldRow`의 `kind==='locked'`, `computeIntfId`). `systemCode`(모달 상단 입력칸)를 바꾸면 `onSystemCodeChange()`가 `INTF_ID`를 즉시 다시 계산한다. 테스트 중인 API 자체로 결정되는 값이라 사용자가 실수로 다른 값을 넣을 수 없게 막은 것.
  - **UI 구분(`index.ejs` `fieldKind`/`FIELD_KIND_STYLE`)**: 구조화 보기의 각 입력 행에 배지+테두리 색으로 fix(회색 "고정값")/variable(주황 "필수 입력", `setting_value`를 placeholder 힌트로 표시)/none(연회색 "선택")/locked(진회색 "자동 고정(수정불가)", 읽기전용)을 구분해, 사용자가 반드시 채워야 하는 값·비워도 되는 값·건드릴 수 없는 값을 한눈에 알 수 있게 한다.
  - **`variable` 필드 중 일부는 값 형식이 고정 규칙이라 자동 계산해 채운다(요청, `index.ejs` `HEADER_AUTO_COMPUTE`)** — 여전히 `variable`(주황 "필수 입력") 배지로 표시되고 편집 가능, 값만 미리 채워질 뿐이다:
    - `FRS_RQST_SYS_CD`(최초요청시스템코드) = 모달 상단 `systemCode`(추천값은 `ep.description`의 첫 토큰).
    - `TMSG_CRE_SYS_NM`(표준전문생성시스템명) = `systemCode` + 랜덤 숫자 5자리.
    - `STD_TMSG_SEQ_NO`(표준전문일련번호) = 랜덤 숫자 1자리 + Unix time(ms, 13자리) = 총 14자리.
    - `ENVR_INFO_DV_CD`(환경정보구분코드) = 고정값 `D`.
    - `FRS_RQST_DTM`(최초요청일시)/`TMSG_RQST_DTM`(표준전문송신일시) = 팝업을 연 시점 기준 `YYYYMMDDHHMMSSTTT`(17자리, 밀리초 포함).
    - `TMSG_WRTG_DT`(표준전문작성일자) = 팝업을 연 시점 기준 `YYYYMMDD`(8자리).
    - `systemCode`는 `openTryModal()`이 `currentPayload` 조립 전에 먼저 확정해 `buildHeaderSection(groups, sysCode)`에 전달한다(전문구조 탭의 정적 "전문 예시"는 특정 엔드포인트 문맥이 없어 플레이스홀더 `{시스템코드}`를 사용).
- Body(`Data`): `ep.params` 전체를 입력 필드로 노출하되, API 스펙상 `required=true`인 항목은 "필수 입력"(주황), `required=false`인 항목은 "선택"(연회색) 배지로 구분. 접두사별로 배열 그룹핑(위 참고).
  - **Data 필드 기본값(`index.ejs` `DATA_FIELD_DEFAULTS`, 요청)**: 여러 API에 공통으로 등장하고 테스트 환경 기준값이 정해진 필드는 리프 필드명(접두사 제외) 기준으로 자동 채운다. 현재 `CORP_CD`(법인 코드) = `1000`. 편집 가능하며, 목록에 없는 필드는 `null`(요청, 빈 문자열 `""` 아님).
- **빈 값 표기(요청, 갱신)**: 헤더/Data를 막론하고 자동으로 채우지 않는 필드는 전문 조립 시 값이 `""`(빈 문자열)이 아니라 `null`이다(`computeHeaderDefault`/`buildDataSection` 공통 규칙). 팝업 입력창은 `null`이어도 빈칸으로 보이며(`makeFieldRow`), 사용자가 입력하면 그 값으로 대체된다.
- 위 자동 조립은 어디까지나 기본값이며, 필드별 null/빈값 처리 등 세부 사양이 SVC마다 다를 수 있어 팝업의 "구조화 보기"에서 편집하거나 "Raw JSON" 탭에서 최종 페이로드를 직접 고쳐서 실행할 수 있다. 실제로 전송되는 값은 항상 사용자가 실행 시점에 확인한 JSON이다.
- **응답 해석(`index.ejs` `renderTryResult`)**: 실제 게이트웨이는 정상/오류 모두 `SystemHeader`/`TransactionHeader`를 포함한 JSON 봉투로 응답하며, `MessageHeader.MSG_DATA_SUB[].MSG_CD`/`MSG_CTNS`(메시지 코드/코드에 대한 한글 명칭)는 성공·실패 모두 채워져 온다(성공 예: `SCMI000001`/"정상적으로 처리되었습니다.", 실패 예: `REME000074`/쿠폰 사용 불가 안내 — 관측된 실 예시로 확인). 결과 패널은 이를 요약으로 먼저 보여주고 전체 원본 응답은 접어서 아래에 둔다:
  1. 응답이 `SystemHeader`/`TransactionHeader`를 포함한 JSON 객체가 아님(예: 게이트웨이의 HTML 404 에러 페이지) → "⚠ 예상된 응답 형식이 아닙니다..." 경고 + 원본 응답을 펼친 상태로 바로 표시(요약할 게 없으므로).
  2/3. 정상 봉투 → `MessageHeader.MSG_PRCS_RSLT_CD`로 성공(`'0'`, 녹색 "✓ 처리 결과")/실패(그 외, 빨강 "⚠ 처리 실패") 배너 + `MSG_DATA_SUB[]`의 `MSG_CD`/`MSG_CTNS` 나열 + `Data`(응답 반환 결과, 비어있으면 "(비어 있음)") 요약 카드를 먼저 보여주고, "▶ 전체 응답 보기" 버튼으로 접힌 전체 JSON을 필요할 때만 펼친다.
- SSRF 방지: 호출 대상 host는 서버 env(`SANDBOX_GATEWAY_BASE_URL`)로 고정, 클라이언트는 `systemCode`(형식 검증됨)와 JSON body만 편집 가능(host 지정 불가). 미설정 시 501.
