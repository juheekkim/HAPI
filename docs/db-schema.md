# DB Schema

> Source of truth: `db/scripts/**` (DDL) and `src/models/**` (queries). Update this file when scripts or queries change. Guesses marked **[Needs verification]**.

## 스크립트 관리 규칙
- `db/scripts/`는 순번 prefix 누적 관리. **기존 스크립트 수정 금지 — 새 순번 스크립트 추가.**
- 현재 존재: `01_create_tables.sql`, `02_seed_data.sql`, `07_partner_firewall_applies.sql`, `16_seed_dev_data.sql`, `17_header_fields_table.sql`, `18_system_header_fields_update.sql`, `19_transaction_header_fields_update.sql`, `20_message_header_fields_update.sql`, `21_create_menu_role_tables.sql`, `22_seed_menu_role_data.sql`, `23_seed_partner_menu_mappings.sql`, `24_restructure_api_menu_hierarchy.sql`, `25_rename_roles_menu_label.sql`, `26_rename_partner_role_to_bigcorp.sql`, `27_add_partner_role_mapping.sql`, `28_local_data_snapshot.sql`(로컬 데이터 스냅샷, `29`가 대체), `29_local_data_snapshot_v2.sql`(최신 로컬 데이터 스냅샷 — `header_fields` 포함 11개 테이블 TRUNCATE 후 재적재), `30_remove_orphan_partner_role.sql`(`29` 스냅샷에 딸려온 고아 `roles.code='partner'` 행 정리), `31_mark_frs_rqst_sys_cd_variable.sql`(`FRS_RQST_SYS_CD`를 `fix`→`variable`로 정정 — 서비스마다 값이 다름, `LCB` 고정 아님), `32_create_system_info_table.sql`(`system_info` 테이블 신설 — API Reference "전문구조" 탭 시스템 정보 표를 하드코딩에서 DB로 이전, `LCB` 2행만 시드), `33_shorten_recv_svc_cd_intf_id_examples.sql`(`RECV_SVC_CD`/`INTF_ID`의 `setting_value` 예시 5개 나열 → 대표 1개+"등"으로 축약 — 실제 가능한 값 전체 목록이 아니라 형식 예시일 뿐임을 명확히 함), `34_label_recv_svc_cd_intf_id_examples.sql`(같은 두 필드의 `setting_value` 앞에 `"예: "` 접두어 추가 — `variable` 타입 필드의 값이 고정값으로 오해되지 않도록 예시임을 명시), `35_remove_auth_api_doc_menu.sql`(API Reference "공통 > 인증" 문서 메뉴 삭제 — 로그인/로그아웃은 대외 API가 아니라 포털 자체 기능이라 `api_specs` 항목 없이 참고용으로만 남아 있었음, `role_menus` 매핑은 CASCADE로 함께 정리), `36_seed_error_codes_spec.sql`(`api_specs`에 `domain='error-codes'` 행 신설 — 실제 응답 메시지 코드(REME 계열) 20건을 `error_codes` JSONB로 시드, `menus.id=18` "공통 > 에러 코드"가 그동안 빈 화면이었던 것을 해소), `37_add_error_codes_batch2.sql`(같은 목록에 신규 확인된 5건 추가 — `code` 기준 중복 제외 append 방식이라 반복 실행해도 안전, 현재 총 25건), `38_fix_reme000054_desc_typo.sql`(`REME000054`의 `desc`가 원본 문서 오타로 "종료일자(CUST_NO)"였던 것을 "종료일자(END_DATE)"로 정정 — 같은 배치의 `REME000053`과 대응되는 필드명), `39_create_common_codes_table.sql`(`common_codes` 테이블 신설 — API Reference "공통 > 공통 코드"(`menus.id=75`, doc=common-codes) 화면용 코드 그룹표, 사업장코드/`BRCH_CD` 12건 시드), `40_seed_loc_cd_common_codes.sql`(같은 테이블에 영업장코드/`LOC_CD` 그룹 15건 추가), `41_seed_corp_cd_common_code.sql`(법인코드/`CORP_CD` 그룹 1건 추가 — `display_order=0`으로 다른 그룹보다 위에 오도록 지정), `42_create_chatbot_messages_table.sql`(챗봇 위젯 대화 이력 테이블 `chatbot_messages` 신설, `docs/chatbot.md` 참고), `43_create_chatbot_clears_table.sql`(`chatbot_clears` 신설 — "새 대화"가 `chatbot_messages`를 삭제하지 않고 사용자별 초기화 시점만 기록하도록 소프트 리셋 방식으로 변경), `44_update_bigcorp_resort_reservation_api.sql`(`api_specs.domain='condo'`의 대형법인사 예약 등록 엔드포인트를 `HBSREMPRR9901` 및 관리자 확정 21개 파라미터로 갱신; 기존 조회·취소 엔드포인트는 보존하며 재실행 안전), `45_add_chatbot_message_meta.sql`(`chatbot_messages`에 `meta JSONB` 컬럼 추가 — 새로고침/재접속 후 이력 복원 시 assistant 링크·API 트리 유지용, `ADD COLUMN IF NOT EXISTS`라 재실행 안전) (03~06, 08~15 번호 공백 — 이력/누락 여부 **[Needs verification]**).
- 드라이버: `pg` Pool(`src/config/database.js`, `DATABASE_URL`). 파라미터 바인딩(`$1,$2,...`)만 사용.

## 주요 테이블

### users (`01`)
`id PK`, `username UNIQUE`, `password_hash`, `name`, `role`(default `user`; 코드 사용값 `admin`/`BigCorp`), `partner_id`, `created_at`.
- 로그인: `userModel.findByUsername`. 파트너 계정 `username = partner_code`.

### partners (`01`, `role_id`는 `27`)
`id PK`, `company_name`, `manager_name`, `email`, `phone`, `purpose`, `status`(`pending`/`approved`/`rejected`), `reject_reason`, `partner_code VARCHAR(8) UNIQUE`, `processed_at`, `created_at`, `role_id → roles.id (ON DELETE SET NULL)`.
- 승인 시 `partner_code` 채번(8자리 숫자, `adminController.approvePartner`).
- `role_id`: "사용자별 권한관리"(`/admin/partner-roles`, admin 전용)에서 파트너사별로 권한그룹 1개를 지정. `loadNavMenus` 미들웨어와 `apiReferenceController`가 파트너 로그인 시 `users.role`보다 이 매핑을 우선 적용(`partnerModel.getRoleCodeById`). 매핑 없으면(`NULL`) 세션 `users.role`로 폴백.

### firewall_requests (`01`) — 구형/데모
`id PK`, `partner_code → partners.partner_code`, `ip_address`, `port`, `reason`, `approval_status`, `reject_reason`, `payment_status`, `token`, `processed_at`, `created_at`.
- `firewallModel` 사용. Admin `issueToken`만 이 테이블을 갱신 → 아래 주의 참조.

### notices (`01`)
`id PK`, `tag`, `tag_type`(`new`/`notice`/`update`), `title`, `content`, `is_visible`, `created_at`.

### inquiries (`01`)
`id PK`, `user_id → users.id`, `question`, `answer`, `status`(`pending`/`answered`), `is_faq`, `answered_at`, `created_at`.

### api_specs (`01`)
`id PK`, `category`(`resort`/`estate`/`common`), `domain UNIQUE`, `name`, `description`, `endpoints JSONB`, `error_codes JSONB`, `display_order`, `created_at`.
- **테이블에 행이 하나라도 있으면 STATIC_SPECS는 전혀 쓰이지 않는다**(`apiSpecModel.getAll()`이 `result.rows.length > 0`이면 DB 행만 반환 — 도메인별 fallback이 아니라 테이블 전체 단위 fallback). 컬럼 `error_codes` → 모델에서 `errorCodes`로 매핑, 각 원소는 `{code, name, desc}`(메시지코드/메시지명/설명 — `MessageHeader.MSG_DATA_SUB[].MSG_CD`/`MSG_CTNS`, `business-rules.md` §10과 맞춘 형태, `36`에서 `{code,http,desc}`였던 STATIC_SPECS 필드도 함께 정정).
- `error-codes` 도메인(API Reference "공통 > 에러 코드" 메뉴, `menus.id=18`)은 `36`(최초 20건)+`37`(추가 5건, 현재 총 25건)로 실데이터 시드. **`/admin/apis`(`api-form.ejs`)는 여전히 `error_codes` 편집 UI가 없지만**, 별도로 `/admin/codes`(코드 관리) 화면에서 `code`를 키로 개별 추가/수정/삭제 가능 — `apiSpecModel.getErrorCodesForAdmin/addErrorCode/updateErrorCode/deleteErrorCode`가 `error-codes` 도메인 행(없으면 최초 추가 시 자동 생성)의 `error_codes` JSONB 배열만 다룬다. `code` 중복은 JSONB라 DB 제약을 걸 수 없어 컨트롤러(`adminController.createErrorCode/updateErrorCode`)가 기존 배열을 조회해 애플리케이션 레벨로 검증(중복 시 폼에 에러 메시지).
- **Admin이 직접 CRUD**(`/admin/apis`, `adminController.apis/createApi/updateApi/deleteApi` → `apiSpecModel.create/update/delete`) — 단, 위와 같이 `error_codes`는 이 화면에서 다루지 않고 `/admin/codes`가 별도로 다룬다. 관리자 목록 화면은 fallback 없는 `apiSpecModel.getAllForAdmin()`을 사용해 DB 실제 상태만 보여준다. `domain UNIQUE` 위반은 `err.code === '23505'`로 잡아 폼에 에러 메시지로 표시(다른 admin 모듈처럼 조용히 무시하지 않음). `endpoints`는 삽입/수정 시 `JSON.stringify`로 직렬화.

### partner_firewall_applies (`07`) — 실사용
`id PK`, `user_id → users.id`, `source_ip`, `source_hostname`, `dest_ip`, `dest_hostname`, `dest_port`, `approval_status`(`pending`/`approved`/`rejected`), `reject_reason`, `token`, `note`, `requested_at`, `approved_at`.
- Support 신청 + Admin 목록/승인/반려. 승인 시 `token = HWR########` 채번.

### header_fields (`17`, system은 `18`, transaction은 `19`, message는 `20`으로 데이터 교체) — API Reference 헤더 정보
`id PK`, `section`(system/transaction/message), `category`, `field_name_ko`, `field_name_en`, `item_type`, `length`, `field_offset`, `required_request`, `required_mci`, `required_response`, `description`, `setting_type`, `setting_value`, `display_order`, `created_at`.
- API Reference 포털의 SystemHeader, TransactionHeader, MessageHeader 정보 관리 (하드코딩 → DB 이전).
- 53개 행: system(29, 8개 카테고리 + 무분류 1행, `18`로 교체된 실제 표준전문 스펙) + transaction(18, 4개 카테고리, `19`로 생성주체 기호 교체) + message(5, 무분류 2건 + `메시지 데이터부(MSG_DATA_SUB)` 3건, `20`으로 재구성).
- `required_request`/`required_mci`/`required_response`는 생성주체 기호(`○`/`●`/`△`/`▲`/`×`)를 저장한다. `17`의 transaction/message 데이터는 `required_request`/`required_response`에 `'Y'`를 넣고(message는 실제 기호 대신 획일적 'Y'), 실제 기호는 `required_mci` 또는 다른 위치에 잘못 매핑된 버그가 있었음 — `19`(transaction), `20`(message)에서 정정.
- `getAllWithGrouping()`이 반환하는 `fields` JSON 항목의 `description`/`settingValue`에는 실제 줄바꿈(`\n`)이 포함될 수 있으며, 뷰(`_headerFieldTable.ejs`)는 `white-space:pre-line`으로 그대로 표시한다.
- 인덱스: `idx_header_fields_section`, `idx_header_fields_category`.
- 쿼리: `headerFieldModel.getAllWithGrouping()` → section/category 그룹화 후 EJS 동적 렌더링. 컨트롤러는 system/transaction/message 모두 `{ category, fields }[]` 형태로 통일해 뷰에 전달한다.
- `setting_type`/`setting_value`/`required_request`는 문서 표시용 외에 API Reference "테스트" 샌드박스(`docs/business-rules.md` §10)의 요청 헤더 자동입력 규칙에도 재사용된다(`fix`→값 그대로, `variable`→일부 필드만 공식 계산, `required_request==='×'`→요청 제외).

### system_info (`32`) — API Reference "전문구조" 탭 시스템 정보
`id PK`, `system_name`, `system_code`, `protocol`, `division`(구분, 예: 회원/비회원), `source`, `target`, `message_format`, `charset`, `remark`, `display_order`, `created_at`.
- 같은 `system_code`가 `division`별로 여러 행을 가질 수 있다(예: `LCB`의 회원/비회원 2행) — `system_name`/`protocol`/`target`/`message_format`/`charset`/`remark`는 같은 시스템이면 모든 행에 동일하게 반복 저장한다(정규화하지 않음, `header_fields`의 category 그룹핑과 동일한 패턴).
- 이전에는 `index.ejs`에 `LCB` 한 건만 하드코딩돼 있었으나, 운영 중 신규 시스템 코드가 계속 추가되는 구조라 DB로 이전했다(`32_create_system_info_table.sql`이 `LCB` 2행만 시드). 신규 시스템(예: `OCH`)은 관리자 UI 없이 새 번호의 `db/scripts/` INSERT 스크립트로 추가한다 — 화면 코드 변경 불필요.
- 쿼리: `systemInfoModel.getAllGrouped()` → `system_code`(+동일 반복 컬럼) 기준 `GROUP BY`, `division`/`source`는 `array_agg`로 `rows` JSON 배열에 담아 반환. 뷰(`_systemInfoTable.ejs`)가 `rows.length`만큼 `rowspan`을 계산해 렌더링.
- 인덱스: `idx_system_info_system_code`.

### common_codes (`39`) — API Reference "공통 코드" 탭
`id PK`, `group_code`(예: `BRCH_CD`, `LOC_CD`), `group_name`(예: 사업장코드, 영업장코드), `detail_code`, `description`, `display_order`, `created_at`.
- `group_code` 하나에 `detail_code` 여러 건이 딸리는 구조(`system_info`와 동일한 "그룹 rowspan" 패턴, 정규화하지 않고 `group_code`/`group_name`을 각 행에 반복 저장). menus.id=75 "공통 > 공통 코드"(`doc=common-codes`)가 참조.
- 최초 시드는 `db/scripts/` INSERT(`39`~`41`)로 관리자 UI 없이 넣었으나, **이후 `/admin/codes`(코드 관리, `commonCodeModel.getAllForAdmin/create/update/delete`)에서 개별 행 단위 CRUD 가능**해짐 — 신규 그룹/코드는 이제 관리자 화면에서 등록하는 것을 권장, db/scripts는 최초 대량 시드나 팀 공유용 스냅샷에만 사용. 현재 시드된 그룹: `CORP_CD`(법인코드, `41`, 1건, 화면 맨 위), `BRCH_CD`(사업장코드, `39`, 12건), `LOC_CD`(영업장코드, `40`, 15건). 정렬 순서를 앞세우려면 `display_order`를 기존 그룹보다 작은 값으로.
- 쿼리: `commonCodeModel.getAllGrouped()`(API Reference 조회용) → `group_code`+`group_name` 기준 `GROUP BY`, `detail_code`/`description`은 `array_agg`로 `rows` JSON 배열(`detailCode`/`description`)에 담아 반환. 뷰(`_commonCodeTable.ejs`)가 `rows.length`만큼 `rowspan` 렌더링. `getAllForAdmin()`은 관리자 화면 전용으로 그룹핑 없이 `id` 기준 플랫 목록 반환.
- 인덱스: `idx_common_codes_group_code`.

### roles (`21`) — 역할(권한 그룹)
`id PK`, `code VARCHAR(30) UNIQUE`(`admin`/`BigCorp`/...), `name`, `description`, `is_active`, `created_at`, `updated_at`.
- `roleModel` CRUD. `code UNIQUE` 위반은 컨트롤러가 `err.code === '23505'`로 잡아 폼 에러로 표시(`createRole`/`updateRole`).
- 시드(`22`): `admin`(관리자), `partner`(파트너사) — `26_rename_partner_role_to_bigcorp.sql`이 `partner` → `BigCorp`로 전면 변경(`roles.code` + `users.role` 동시 반영).

### menus (`21`) — 계층 메뉴
`id PK`, `parent_id → menus.id (ON DELETE CASCADE)`(최상위는 NULL), `name`, `path`(그룹 헤더는 NULL), `menu_type`(`nav`/`admin-tab`/`api-doc`/`group`), `icon`, `admin_only`, `display_order`, `is_active`, `created_at`, `updated_at`.
- `menuModel`. 트리는 `getAllWithChildren()`이 평면 조회 후 JS에서 `parent_id`로 `children[]` 조립(재귀 CTE 미사용, 얕은 계층).
- 시드(`22`): 상단 nav 5 + 관리자 서브탭 7 + apiReference 사이드바(그룹 3 → 문서 8, **2단계 중첩**, `35`에서 "공통 > 인증" 삭제로 현재 7). API 사이드바 계층은 `24_restructure_api_menu_hierarchy.sql`으로 정상화됨 — **그룹(공통/리조트/에스테이트)이 각 문서(api-doc)의 부모**. API 대메뉴 path는 `/api-reference`(doc 미지정).
- 렌더링: 상단 대메뉴(`loadNavMenus` 미들웨어)와 API 사이드바(`apiReferenceController` + `menuModel.getApiSidebarByRole`) 모두 `role_menus` 기반 **동적 렌더링 적용됨**. `getApiSidebarByRole`는 API 서브트리를 **임의 depth 재귀**로 순회(2단계 고정 아님)하므로 메뉴 관리에서 만든 깊은 계층이 그대로 반영된다. 관리자 `admin-tabs`만 아직 하드코딩.

### role_menus (`21`) — 역할↔메뉴 매핑
`role_id → roles.id (ON DELETE CASCADE)`, `menu_id → menus.id (ON DELETE CASCADE)`, `PRIMARY KEY(role_id, menu_id)`.
- `roleModel.setMenus(roleId, menuIds)`가 매핑을 통째로 교체 — **코드베이스 최초의 트랜잭션 사용**(`pool.connect()` → `BEGIN` → `DELETE` → `INSERT ... unnest($2::int[])` → `COMMIT`, 오류 시 `ROLLBACK`, `finally { client.release() }`로 커넥션 반환). 그 외 모델은 기존대로 공유 `pool.query`.
- 매트릭스 화면은 `roleModel.getAllMenuIdsByRole()`로 `{roleId: [menuId...]}`를 1쿼리로 조회(N+1 방지). 시드(`22`)에서 `admin`은 전체 메뉴 매핑.
- **동적 렌더링은 "매핑된 메뉴만 노출"(opt-in)** 모델이다. `22`에서 `partner`가 무매핑이라 대메뉴가 비던 문제를, `23_seed_partner_menu_mappings.sql`이 `partner`에 `admin_only=false` 전체 메뉴를 매핑해 복구한다(= 관리자 제외 전체). 이후 새 role은 `/admin/roles`에서 명시적으로 매핑해야 메뉴가 보인다. (매핑은 `role_id` 기준이라 `26`의 `partner`→`BigCorp` code 변경 후에도 그대로 유지됨.)

### chatbot_messages (`42`) — 챗봇 위젯 대화 원본 기록
`id PK`, `user_id → users.id (ON DELETE CASCADE)`, `role`(`user`/`assistant`), `content TEXT`, `meta JSONB`(assistant 링크/트리 복원용, 예 `{ apiDocs }` — `45`에서 추가), `created_at TIMESTAMPTZ DEFAULT now()`.
- 사용자당 단일 연속 스레드(append-only, 대화방 개념 없음). **행을 삭제하지 않는다** — "새 대화"는 `chatbot_clears`만 갱신(아래).
- 인덱스: `idx_chatbot_messages_user_id(user_id, created_at)` — 사용자별 시간순 조회 최적화.
- 상세는 `docs/chatbot.md` 참고(Tools 목록, 보안 범위, LLM 연동 환경변수).

### chatbot_clears (`43`) — 챗봇 "새 대화" 경계
`user_id PK → users.id (ON DELETE CASCADE)`, `cleared_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- 사용자당 최대 1행(upsert). `chatbotModel.getHistory()`가 `chatbot_messages.created_at > cleared_at`인 행만 조회해 위젯/LLM 컨텍스트에 노출한다 — `chatbot_messages` 원본은 그대로 두는 소프트 리셋.
- `chatbotModel.clearHistory(userId)`가 `INSERT ... ON CONFLICT (user_id) DO UPDATE`로 갱신.

## 관계 요약
- `users.partner_id → partners.id` (**FK 제약 없음 [Needs verification]**; 컬럼만 존재).
- `firewall_requests.partner_code → partners.partner_code` (ON DELETE SET NULL).
- `inquiries.user_id → users.id`, `partner_firewall_applies.user_id → users.id` (ON DELETE SET NULL).
- `menus.parent_id → menus.id` (ON DELETE CASCADE, 자기참조). `role_menus.role_id → roles.id`, `role_menus.menu_id → menus.id` (둘 다 ON DELETE CASCADE).
- `users.role`(문자열) ↔ `roles.code`는 FK 없이 **문자열 매칭**으로 연결됨(`menuModel.getNavMenusByRole`, `menuModel.getApiSidebarByRole` 등이 `WHERE code = $1`로 조회). 두 값은 항상 동기화되어야 함 — 예: `26_rename_partner_role_to_bigcorp.sql`은 `roles.code`와 `users.role`을 동시에 변경.
- `partners.role_id → roles.id`(`27`, 실제 FK): 파트너 로그인 사용자는 이 매핑이 `users.role` 문자열 매칭보다 **우선 적용**된다(`loadNavMenus`, `apiReferenceController`가 `sessionUser.partnerId`로 조회). 관리자(admin, `partnerId` 없음)는 `users.role`만 사용. 사용자 단위(개별 users row) FK는 여전히 없음 — 다음 이터레이션 **[예정]**.

## 인덱스 (`01`, `07`, `21`, `42`)
`idx_partners_status`, `idx_firewall_approval_status`, `idx_notices_created_at(DESC)`, `idx_inquiries_status`, `idx_api_specs_category`, `idx_pfa_user`, `idx_menus_parent_id`, `idx_menus_display_order`, `idx_role_menus_menu_id`, `idx_chatbot_messages_user_id`.

## 주요 쿼리 (models)
- 조회: 대부분 `SELECT ... ORDER BY created_at/requested_at DESC`. Admin 방화벽은 `partner_firewall_applies`에 `users`·`partners` LEFT JOIN.
- 저장: 파트너/문의/공지/방화벽 신청 INSERT, 상태 UPDATE(`now()` 기록).

## 주의사항 / 확인 필요
1. **방화벽 이중 구조**: 목록/승인은 `partner_firewall_applies`, 반면 `adminController.issueToken` → `firewallModel.issueToken`은 `firewall_requests`를 갱신. id가 다른 테이블을 가리켜 오작동 가능. → 정리 필요 **[Needs verification]**.
2. **STATIC fallback**: `partnerModel`, `noticeModel`, `inquiryModel(getRecent)`, `firewallModel`, `apiSpecModel`은 DB 오류/빈 결과 시 하드코딩 데이터 반환(데모). 운영에서 오해 소지 — 확인 필요.
3. `users.role` 스키마 주석은 `admin|user`이나 코드가 `BigCorp`를 삽입 — 주석/도메인 불일치.
4. `users.partner_id`에 FK 제약이 없어 참조 무결성 미보장 **[Needs verification]**.
5. 성능: 조회는 소규모/인덱스 존재로 문제 낮음. `partner_firewall_applies`의 다중 JOIN은 데이터 증가 시 인덱스 검토 필요.

## 시드/계정
- 어드민: `npm run db:setup` → `admin`/`admin123`.
- 개발 시드: `16_seed_dev_data.sql`(파트너/계정/문의). `createPartnerUser.js`는 하드코딩 접속 문자열 사용 — 운영 사용 금지 **[Needs verification]**.
