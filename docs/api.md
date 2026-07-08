# API — 포털이 문서화하는 리조트 API 스펙

> 이 문서는 **포털이 외부 연동사에 안내하는 리조트 API 스펙**을 정리한다. 실제 구현체는 이 저장소에 없다(외부 백엔드). Source of truth: `src/models/apiSpecModel.js`(STATIC_SPECS) + `api_specs` 테이블 + `db/scripts/02_seed_data.sql`.

## 데이터 소스
- 화면(`/api-reference`)은 `apiSpecModel.getAll()` 사용: `api_specs`에 행이 있으면 DB, 없거나 오류면 `STATIC_SPECS`.
- 컬럼: `category`, `domain`(UNIQUE, 선택키), `name`, `description`, `endpoints`(JSONB), `error_codes`(JSONB), `display_order`.
- 엔드포인트 구조: `{ method, url, description, params:[{name,type,required,desc}], responseExample }`.
- **등록 경로**: 관리자가 `/admin/apis`(`views/admin/{apis,api-form}.ejs` → `adminController` → `apiSpecModel`)에서 위 구조 그대로 수기 등록/수정/삭제한다. 폼에서 엔드포인트·파라미터를 동적으로 추가/삭제한 뒤 제출 시 `endpoints` JSON으로 직렬화되어 저장되므로, STATIC_SPECS와 동일한 스키마로 API Reference 화면에 바로 반영된다. 단, `api_specs`에 **1건이라도 등록되면 그 순간부터 `getAll()`은 STATIC_SPECS를 반환하지 않는다**(전량 DB 데이터로 전환).

## 스펙 목록 (STATIC_SPECS 기준)
| category | domain | name | 주요 엔드포인트 |
|---|---|---|---|
| resort | condo | 콘도 예약 API | POST/GET/DELETE `/api/v1/resort/condo/reserve` |
| resort | golf | 골프 예약 API | POST `/api/v1/resort/golf/reserve` |
| resort | product | 상품/쿠폰 API | GET `/api/v1/resort/products` |
| resort | hlive | H-LIVE 포인트 API | GET `/api/v1/hlive/points/{memberId}` |
| estate | estate | 에스테이트 숙박 예약 API | POST `/api/v1/estate/reserve` |
| estate | estate-facility | 부대시설 예약 API | GET `/api/v1/estate/facilities` |
| common | error-codes | 공통 에러 코드 | (errorCodes 목록) |
| common | auth | 인증 API | POST `/api/v1/auth/token` |

## 공통 규약 (스펙상)
- 응답: `{ resultCode, resultMsg, data }`. 성공 `resultCode="0000"`.
- 인증: `POST /api/v1/auth/token`으로 `partnerId`+`partnerKey` → `accessToken`(JWT, `expiresIn`). 이후 Bearer Token.
- 공통 에러 코드: `0000` 성공 / `0001` 잘못된 파트너 코드 / `0002` 토큰 만료 / `0003` 권한 없음 / `0004` 리소스 없음 / `9999` 서버 오류.

## 주의 / 확인 필요
- STATIC_SPECS와 `02_seed_data.sql`(condo만 시드)의 내용이 **완전히 일치하지 않을 수 있음** — DB 시드 확장 시 동기화 필요 **[Needs verification]**.
- `views/apiReference/index.ejs` 좌측 사이드바는 domain 링크가 하드코딩되어 있어, Admin에서 새 `domain`을 등록해도 사이드바에 자동으로 나타나지 않는다(`?doc=<domain>` 직접 접근은 가능). 사이드바 동적화는 API Reference 담당(박승욱)과 협의 필요.
- 헤더 네비 링크 `/api-reference?doc=header`의 `header`는 존재하지 않는 domain → `specs[0]` 폴백. 의도 확인 필요 **[Needs verification]**.
- 실제 API 게이트웨이/인증 서버 주소·환경(운영/스테이징)은 코드에 없음 **[Needs verification]**.

## 문서 갱신
- 스펙 추가/변경 시 `apiSpecModel.STATIC_SPECS`와 `api_specs` 시드, 그리고 본 문서를 함께 갱신.
