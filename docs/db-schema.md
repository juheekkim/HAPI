# DB Schema

> Source of truth: `db/scripts/**` (DDL) and `src/models/**` (queries). Update this file when scripts or queries change. Guesses marked **[Needs verification]**.

## 스크립트 관리 규칙
- `db/scripts/`는 순번 prefix 누적 관리. **기존 스크립트 수정 금지 — 새 순번 스크립트 추가.**
- 현재 존재: `01_create_tables.sql`, `02_seed_data.sql`, `07_partner_firewall_applies.sql`, `16_seed_dev_data.sql` (03~06, 08~15 번호 공백 — 이력/누락 여부 **[Needs verification]**).
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

## 관계 요약
- `users.partner_id → partners.id` (**FK 제약 없음 [Needs verification]**; 컬럼만 존재).
- `firewall_requests.partner_code → partners.partner_code` (ON DELETE SET NULL).
- `inquiries.user_id → users.id`, `partner_firewall_applies.user_id → users.id` (ON DELETE SET NULL).

## 인덱스 (`01`, `07`)
`idx_partners_status`, `idx_firewall_approval_status`, `idx_notices_created_at(DESC)`, `idx_inquiries_status`, `idx_api_specs_category`, `idx_pfa_user`.

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
