# Business Rules — 업무 규칙

> Source of truth: `src/controllers/**`, `src/models/**`, `src/middlewares/**`. 확인된 사실과 추측을 구분한다. 추측은 **[Needs verification]**.

## 1. 사용자 / 권한
- 역할(role): `admin`(내부 담당자), `partner`(연동사 담당자). 스키마 기본값은 `user`이나 실제 삽입값은 위 둘.
- 세션 로그인(`express-session`). 로그인 성공 시 `req.session.user = { id, name, role, partnerId }`.
- 접근 제어:
  - `auth/*`(로그인, 파트너 신청)만 공개.
  - `home`, `guide`, `api-reference`, `support`는 로그인 필요(`isAuthenticated`).
  - `admin/*`는 `isAuthenticated` + `isAdmin`(role === 'admin'). 미인증 → `/auth/login` 리다이렉트, 권한 없음 → 403.
- `/` 접근 시 로그인돼 있으면 `/home`, 아니면 `/auth/login`.

## 2. 파트너사 온보딩 (확정 흐름)
1. 파트너가 `/auth/apply`로 신청 → `partners` 저장(`status='pending'`).
2. 관리자가 `/admin/partners`에서 승인/반려.
   - 승인: `partner_code` = 8자리 숫자 난수 채번 → `partners.status='approved'` + code 저장. 이어서 로그인 계정 생성: `users(username=code, password=bcrypt(code), role='partner', partner_id)`. **초기 비밀번호 = partner_code.**
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

## 7. 예외 / 에지 케이스
- DB 미연결·쿼리 오류: 다수 조회 모델이 STATIC fallback 반환하고 화면은 정상 렌더(에러 숨김) → 운영 시 오해 소지, 로깅만 수행.
- 입력 검증: 로그인은 빈값 체크. 그 외 폼(신청/문의/방화벽)은 서버측 강한 검증이 약함 → 보강 대상 **[Needs verification]**.
- 파트너 중복 신청/재승인 방지 규칙: 코드에 명시 없음 **[Needs verification]**.

## 8. 시스템 이동 조건 (메뉴 분기)
- 헤더 메뉴는 로그인 사용자 공통, `role==='admin'`일 때만 "관리자" 탭 노출.
- 별도 포탈(파트너 전용/관리자 전용) URL 분리는 없고 단일 포털에서 권한으로 분기. 세부는 `docs/menu-routing.md`.
