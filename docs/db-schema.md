# DB Schema

> Source of truth: `db/scripts/**` (DDL) and `src/models/**` (queries). Update this file when scripts or queries change. Guesses marked **[Needs verification]**.

## 스크립트 관리 규칙
- `db/scripts/`는 순번 prefix 누적 관리. **기존 스크립트 수정 금지 — 새 순번 스크립트 추가.**
- 현재 존재: `01_create_tables.sql`, `02_seed_data.sql`, `07_partner_firewall_applies.sql`, `16_seed_dev_data.sql`, `17_header_fields_table.sql`, `18_system_header_fields_update.sql`, `19_transaction_header_fields_update.sql`, `20_message_header_fields_update.sql`, `21_create_menu_role_tables.sql`, `22_seed_menu_role_data.sql`, `23_seed_partner_menu_mappings.sql`, `24_restructure_api_menu_hierarchy.sql` (03~06, 08~15 번호 공백 — 이력/누락 여부 **[Needs verification]**).
- 드라이버: `pg` Pool(`src/config/database.js`, `DATABASE_URL`). 파라미터 바인딩(`$1,$2,...`)만 사용.

## 주요 테이블

### users (`01`)
`id PK`, `username UNIQUE`, `password_hash`, `name`, `role`(default `user`; 코드 사용값 `admin`/`partner`), `partner_id`, `created_at`.
- 로그인: `userModel.findByUsername`. 파트너 계정 `username = partner_code`.

### partners (`01`)
`id PK`, `company_name`, `manager_name`, `email`, `phone`, `purpose`, `status`(`pending`/`approved`/`rejected`), `reject_reason`, `partner_code VARCHAR(8) UNIQUE`, `processed_at`, `created_at`.
- 승인 시 `partner_code` 채번(8자리 숫자, `adminController.approvePartner`).

### firewall_requests (`01`) — 구형/데모
`id PK`, `partner_code → partners.partner_code`, `ip_address`, `port`, `reason`, `approval_status`, `reject_reason`, `payment_status`, `token`, `processed_at`, `created_at`.
- `firewallModel` 사용. Admin `issueToken`만 이 테이블을 갱신 → 아래 주의 참조.

### notices (`01`)
`id PK`, `tag`, `tag_type`(`new`/`notice`/`update`), `title`, `content`, `is_visible`, `created_at`.

### inquiries (`01`)
`id PK`, `user_id → users.id`, `question`, `answer`, `status`(`pending`/`answered`), `is_faq`, `answered_at`, `created_at`.

### api_specs (`01`)
`id PK`, `category`(`resort`/`estate`/`common`), `domain UNIQUE`, `name`, `description`, `endpoints JSONB`, `error_codes JSONB`, `display_order`, `created_at`.
- 비었으면 `apiSpecModel.STATIC_SPECS` 반환. 컬럼 `error_codes` → 모델에서 `errorCodes`로 매핑.
- **Admin이 직접 CRUD**(`/admin/apis`, `adminController.apis/createApi/updateApi/deleteApi` → `apiSpecModel.create/update/delete`). 관리자 목록 화면은 fallback 없는 `apiSpecModel.getAllForAdmin()`을 사용해 DB 실제 상태만 보여준다. `domain UNIQUE` 위반은 `err.code === '23505'`로 잡아 폼에 에러 메시지로 표시(다른 admin 모듈처럼 조용히 무시하지 않음). `endpoints`는 삽입/수정 시 `JSON.stringify`로 직렬화.

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

### roles (`21`) — 역할(권한 그룹)
`id PK`, `code VARCHAR(30) UNIQUE`(`admin`/`partner`/...), `name`, `description`, `is_active`, `created_at`, `updated_at`.
- `roleModel` CRUD. `code UNIQUE` 위반은 컨트롤러가 `err.code === '23505'`로 잡아 폼 에러로 표시(`createRole`/`updateRole`).
- 시드(`22`): `admin`(관리자), `partner`(파트너사).

### menus (`21`) — 계층 메뉴
`id PK`, `parent_id → menus.id (ON DELETE CASCADE)`(최상위는 NULL), `name`, `path`(그룹 헤더는 NULL), `menu_type`(`nav`/`admin-tab`/`api-doc`/`group`), `icon`, `admin_only`, `display_order`, `is_active`, `created_at`, `updated_at`.
- `menuModel`. 트리는 `getAllWithChildren()`이 평면 조회 후 JS에서 `parent_id`로 `children[]` 조립(재귀 CTE 미사용, 얕은 계층).
- 시드(`22`): 상단 nav 5 + 관리자 서브탭 7 + apiReference 사이드바(그룹 3 → 문서 8, **2단계 중첩**). API 사이드바 계층은 `24_restructure_api_menu_hierarchy.sql`으로 정상화됨 — **그룹(공통/리조트/에스테이트)이 각 문서(api-doc)의 부모**. API 대메뉴 path는 `/api-reference`(doc 미지정).
- 렌더링: 상단 대메뉴(`loadNavMenus` 미들웨어)와 API 사이드바(`apiReferenceController` + `menuModel.getApiSidebarByRole`) 모두 `role_menus` 기반 **동적 렌더링 적용됨**. `getApiSidebarByRole`는 API 서브트리를 **임의 depth 재귀**로 순회(2단계 고정 아님)하므로 메뉴 관리에서 만든 깊은 계층이 그대로 반영된다. 관리자 `admin-tabs`만 아직 하드코딩.

### role_menus (`21`) — 역할↔메뉴 매핑
`role_id → roles.id (ON DELETE CASCADE)`, `menu_id → menus.id (ON DELETE CASCADE)`, `PRIMARY KEY(role_id, menu_id)`.
- `roleModel.setMenus(roleId, menuIds)`가 매핑을 통째로 교체 — **코드베이스 최초의 트랜잭션 사용**(`pool.connect()` → `BEGIN` → `DELETE` → `INSERT ... unnest($2::int[])` → `COMMIT`, 오류 시 `ROLLBACK`, `finally { client.release() }`로 커넥션 반환). 그 외 모델은 기존대로 공유 `pool.query`.
- 매트릭스 화면은 `roleModel.getAllMenuIdsByRole()`로 `{roleId: [menuId...]}`를 1쿼리로 조회(N+1 방지). 시드(`22`)에서 `admin`은 전체 메뉴 매핑.
- **동적 렌더링은 "매핑된 메뉴만 노출"(opt-in)** 모델이다. `22`에서 `partner`가 무매핑이라 대메뉴가 비던 문제를, `23_seed_partner_menu_mappings.sql`이 `partner`에 `admin_only=false` 전체 메뉴를 매핑해 복구한다(= 관리자 제외 전체). 이후 새 role은 `/admin/roles`에서 명시적으로 매핑해야 메뉴가 보인다.

## 관계 요약
- `users.partner_id → partners.id` (**FK 제약 없음 [Needs verification]**; 컬럼만 존재).
- `firewall_requests.partner_code → partners.partner_code` (ON DELETE SET NULL).
- `inquiries.user_id → users.id`, `partner_firewall_applies.user_id → users.id` (ON DELETE SET NULL).
- `menus.parent_id → menus.id` (ON DELETE CASCADE, 자기참조). `role_menus.role_id → roles.id`, `role_menus.menu_id → menus.id` (둘 다 ON DELETE CASCADE).
- `users.role`(문자열) ↔ `roles.code` 연결은 아직 없음. 사용자↔역할 매핑(users에 role_id FK 등)은 다음 이터레이션 **[예정]**.

## 인덱스 (`01`, `07`, `21`)
`idx_partners_status`, `idx_firewall_approval_status`, `idx_notices_created_at(DESC)`, `idx_inquiries_status`, `idx_api_specs_category`, `idx_pfa_user`, `idx_menus_parent_id`, `idx_menus_display_order`, `idx_role_menus_menu_id`.

## 주요 쿼리 (models)
- 조회: 대부분 `SELECT ... ORDER BY created_at/requested_at DESC`. Admin 방화벽은 `partner_firewall_applies`에 `users`·`partners` LEFT JOIN.
- 저장: 파트너/문의/공지/방화벽 신청 INSERT, 상태 UPDATE(`now()` 기록).

## 주의사항 / 확인 필요
1. **방화벽 이중 구조**: 목록/승인은 `partner_firewall_applies`, 반면 `adminController.issueToken` → `firewallModel.issueToken`은 `firewall_requests`를 갱신. id가 다른 테이블을 가리켜 오작동 가능. → 정리 필요 **[Needs verification]**.
2. **STATIC fallback**: `partnerModel`, `noticeModel`, `inquiryModel(getRecent)`, `firewallModel`, `apiSpecModel`은 DB 오류/빈 결과 시 하드코딩 데이터 반환(데모). 운영에서 오해 소지 — 확인 필요.
3. `users.role` 스키마 주석은 `admin|user`이나 코드가 `partner`를 삽입 — 주석/도메인 불일치.
4. `users.partner_id`에 FK 제약이 없어 참조 무결성 미보장 **[Needs verification]**.
5. 성능: 조회는 소규모/인덱스 존재로 문제 낮음. `partner_firewall_applies`의 다중 JOIN은 데이터 증가 시 인덱스 검토 필요.

## 시드/계정
- 어드민: `npm run db:setup` → `admin`/`admin123`.
- 개발 시드: `16_seed_dev_data.sql`(파트너/계정/문의). `createPartnerUser.js`는 하드코딩 접속 문자열 사용 — 운영 사용 금지 **[Needs verification]**.
