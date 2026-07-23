# Chatbot — 우측 하단 위젯

> Source of truth: `src/models/chatbotModel.js`, `src/controllers/chatbotController.js`, `src/routes/chatbot.js`, `src/views/partials/chatbot.ejs`, `src/public/js/common/chatbot.js`. 코드 변경 시 이 문서도 함께 갱신한다.

## 개요
로그인한 모든 페이지 우측 하단에 아이콘 버튼으로 표시되는 대화형 챗봇. 클릭하면 패널이 열리고, OpenAI function calling으로 실제 `hapi_db` 데이터와 포털 정적 콘텐츠를 조회해 답한다. 특정 개발자 소유가 아닌 **공통 영역**(레이아웃/파셜/공용 자원/`app.js`/DB 스크립트와 동일 카테고리, `team-ownership.md` §3 참고)이다.

## 아키텍처
```
views/partials/chatbot.ejs (layouts/main.ejs에 포함, locals.user 있을 때만 렌더)
  └─ public/js/common/chatbot.js (apiClient만 사용, 직접 fetch 금지)
       └─ POST/GET /chatbot/*  (routes/chatbot.js, isAuthenticated 일괄 적용)
            └─ controllers/chatbotController.js
                 ├─ OpenAI 클라이언트 (tools/function calling 루프, 최대 5회 반복)
                 └─ models/chatbotModel.js
                      ├─ chatbot_messages 테이블 (대화 원본 기록, append-only, 삭제 없음)
                      ├─ chatbot_clears 테이블 (사용자별 "새 대화" 경계 시점)
                      └─ 기존 모델 재사용 컨텍스트 헬퍼(아래 §Tools)
```

## LLM / 환경변수
- Provider: 사내 AI 허브(`https://.../api/hub/v1/models/{model}/invoke`). 이미지 자동입력 기능이 쓰는 `ANTHROPIC_API_KEY`와는 **별개의 전용 키**.
- 이 허브는 모델명이 URL 경로에 포함되는 구조라(`{baseUrl}/{model}/invoke`) `openai` npm SDK(내부적으로 `{baseURL}/chat/completions`를 고정 부착)를 쓸 수 없다. SDK 없이 Node 내장 `fetch`로 직접 호출한다(`chatbotController.callLlm`, `SANDBOX_GATEWAY_BASE_URL`의 base+동적세그먼트 조합 패턴과 동일).
- 요청/응답 바디는 OpenAI chat completions 형식과 동일하며(2026-07-20 실호출로 확인 — `{model, messages, tools, tool_choice}` 요청 / `choices[0].message` 응답), tool calling도 정상 동작한다. 인증은 `Authorization: Bearer`가 아니라 **`X-Api-Key` 헤더**(허브가 400 오류로 알려준 실제 요구사항).
- `CHATBOT_LLM_API_KEY` / `CHATBOT_LLM_BASE_URL`(.env) — 둘 중 하나라도 없으면 `/chatbot/message`가 501 반환(다른 기능들의 501 폴백 패턴과 동일). 위젯은 이 경우 "챗봇이 아직 설정되지 않았습니다" 안내만 표시.
- `CHATBOT_LLM_MODEL`(.env, 기본값 `gpt-5.4-mini`) — 다른 모델로 교체 가능하나, 이 허브 구조상 URL 경로도 함께 바뀌므로 `CHATBOT_LLM_BASE_URL`은 `.../models`까지만 두고 모델명은 이 값으로만 관리한다.

## Tools(함수 9개, 모두 읽기 전용)
| 이름 | 설명 | 근거 모델 |
|---|---|---|
| `search_api_docs` | 키워드로 API/엔드포인트/파라미터 검색(로그인 사용자의 `allowedDocs`로 사전 필터링). 키워드를 단어 토큰으로 나눠 필드 가중치(이름/도메인3·설명2·엔드포인트/파라미터1)로 점수화해 관련도순 반환, 상한 12건. 빈 키워드 또는 매칭 0건이면 접근 가능한 전체 목록으로 폴백 | `apiSpecModel.getAll()` |
| `get_notices` | 노출 공지 상위 10건 | `noticeModel.getVisible()` |
| `get_faqs` | 공개 FAQ | `inquiryModel.getFaqs()` |
| `get_common_codes` | 공통 코드 그룹 | `commonCodeModel.getAllGrouped()` |
| `get_error_codes` | 에러 코드(REME 계열) | `apiSpecModel`의 `error-codes` 도메인 |
| `get_system_info` | 시스템코드별 접속정보 | `systemInfoModel.getAllGrouped()` |
| `get_header_fields` | Header 필드 정의(system/transaction/message) | `headerFieldModel.getAllWithGrouping()` |
| `get_guide_info` | 온보딩 절차/체크리스트/용어집 | `chatbotModel.GUIDE_INFO`(정적 문자열, `views/guide/index.ejs` 요약) |
| `get_my_support_status` | **로그인 사용자 본인**의 문의 내역/방화벽 신청 현황 | `inquiryModel.getByUserId` + `partnerFirewallApplyModel.getByUserId` |

## 보안 범위
- 모든 `/chatbot/*` 라우트는 `isAuthenticated` 필수 — 비로그인 사용자는 위젯 자체가 렌더되지 않는다(`chatbot.ejs`의 `locals.user` 체크).
- `search_api_docs`는 `chatbotModel.resolveAllowedDocs(sessionUser)`로 파트너 권한 밖 API 문서를 사전에 제외한다. 이 함수는 `apiReferenceController.js`(박승욱 소유 파일)의 동명 로직을 **의도적으로 재구현**한 것 — 소유 파일을 직접 import/수정하지 않기 위함. `menuModel.getApiSidebarByRole`/`partnerModel.getRoleCodeById` 로직이 바뀌면 두 곳 모두 갱신해야 한다.
- `get_my_support_status`는 `userId`를 항상 **서버 세션에서 고정 주입**한다. LLM이나 클라이언트가 다른 사용자의 id를 지정해 데이터를 요청할 수 없다.
- 노출되지 않는 데이터: `users.password_hash`, 타 사용자/타 파트너의 문의·신청 내역, `partners` 테이블 원본(이메일/전화 등), admin 전용 화면 데이터. SQL을 직접 실행하는 tool은 없음 — 전부 기존 모델 함수를 통한 파라미터 바인딩 조회.

## 대화 이력
- `chatbot_messages` 테이블(스크립트 `42`)에 사용자당 단일 연속 스레드로 append-only 저장(대화방 개념 없음, `role` = `user`/`assistant`). **삭제 없이 영구 보존**되는 원본 기록.
- 패널은 **아이콘 클릭으로만 열리고 X 버튼으로만 닫힌다**(페이지 이동 시 자동으로 열리지 않음, `chatbot.js`의 `openPanel`/`closePanel`). 이 포털은 SPA가 아니라 페이지마다 새로 렌더되는 SSR 구조라 페이지를 이동하면 위젯은 항상 닫힌 아이콘 상태로 다시 시작하지만, 대화 **내용**은 `chatbot_messages`에 영구 저장되어 있으므로 어느 페이지에서 아이콘을 다시 눌러도 `loadHistory()`가 전체 이력을 불러와 이어서 대화할 수 있다.
- 서버가 LLM에 보내는 컨텍스트는 최근 50건으로 캡(`MAX_HISTORY`, `chatbotController.js`) — 토큰 비용/컨텍스트 길이 제한.
- "새 대화" 버튼(`POST /chatbot/clear`)은 `chatbot_messages`를 **삭제하지 않는다**. 대신 `chatbot_clears`(스크립트 `43`, `user_id` PK + `cleared_at`)에 그 사용자의 초기화 시점을 upsert하고, `getHistory()`(위젯 하이드레이션과 LLM 컨텍스트 양쪽에서 사용)가 `created_at > cleared_at`인 메시지만 조회한다 — 원본 대화 기록은 DB에 그대로 남고, 화면/LLM에는 그 시점 이후 메시지만 보이는 소프트 리셋이다.

## UI/UX 렌더링
- 패널 기본 크기: 데스크톱 `440x680`(기존 360x520보다 확장), 모바일은 `max-width`/`max-height` 제한으로 뷰포트에 맞게 축소된다(`src/public/css/chatbot.css`).
- Assistant 메시지는 단순 텍스트가 아니라 `markdown` 렌더링으로 표시한다(`src/public/js/common/chatbot.js`). `h1~h4`, 목록, 문단, 인라인 코드(`` `code` ``), 굵은 텍스트(`**bold**`)를 지원한다.
- Fenced code block(````lang ... ````)은 카드형 코드 블록으로 분리해 표시하고, 복사 버튼을 제공한다. `lang`이 `json/jsonc`인 블록은 파싱 성공 시 접기/펼치기 가능한 JSON 트리 뷰어로 렌더링한다.
- 일반 질의는 텍스트(마크다운 강화) 중심으로 표시하고, API 질의는 답변 하단에 "API 문서 트리"(문서→상세 API→요청/응답 필드)를 추가로 렌더링한다.
- 챗봇 UI에는 LLM 통신용 Request/Response/Tool Calls(JSON) 패널을 노출하지 않는다(운영 사용자 기준 불필요 정보).
- API 관련 답변(목록 `1.`/`1)` 또는 본문 언급)에서 API 문서/헤더/필드로 매핑 가능한 텍스트는 클릭 가능한 링크로 렌더링된다. 클릭 시 `/api-reference` 본문 영역만 비동기로 교체해(레이아웃/챗봇 DOM 유지) 해당 위치로 이동한다.
- 챗봇 패널은 링크 클릭 전 상태(열림 여부/메시지 스크롤/입력중 초안)를 `sessionStorage`에 저장했다가 즉시 복원하므로, 사용자 체감상 "챗봇창 유지 + 문서 위치 점프" 동작이 된다.
- 링크 도착 후 API Reference는 query(`focusType`,`ep`,`field`,`section`,`q`)를 해석해 관련 탭/아코디언을 자동으로 펼치고, 대상 섹션/행을 스크롤 + 3초 하이라이트한다(정확 행 매칭 실패 시 섹션 단위 fallback 강조).

## `/chatbot/message` 응답 계약
- 하위 호환: 기존 `reply` 문자열은 그대로 유지한다(기존 클라이언트 영향 없음).
- 확장 필드: `apiDocs`와 `trace`를 함께 내려준다.
     - `apiDocs[]`: API 문서 트리 렌더링 전용 데이터(`search_api_docs` 결과, 문서/엔드포인트/요청 params/응답 필드 요약)
- `trace`는 서버 진단/후속 확장용 메타데이터로 유지한다(현재 UI 비노출).
     - `trace.model`: 사용 모델명
     - `trace.iterations`: tool calling 루프 반복 횟수
     - `trace.showApiTrace`: API 질의 판별 플래그(현재 UI 비노출)
     - `trace.request`: 사용자 질의 원문
     - `trace.toolCalls[]`: 각 도구 호출의 `id/name/args/result` 요약(긴 값은 서버에서 길이 제한)
     - `trace.response`: 최종 응답(가능하면 JSON 파싱 결과, 아니면 문자열)
- `apiDocs`는 assistant 메시지의 `chatbot_messages.meta`(JSONB, `45`에서 추가)에 함께 저장한다 → 새로고침·재접속 후 이력 복원 시 텍스트뿐 아니라 링크·API 트리도 그대로 재구성된다(`getHistory`가 `meta`를 내려주고, 프론트 `loadHistory`가 `appendMessage(role, content, meta)`로 전달). `trace`는 진단용이라 저장하지 않는다(현재 턴 응답에만 포함).

## 아이콘 커스터마이징
- 기본 아이콘: `src/public/images/chatbot-icon.svg`(placeholder 말풍선).
- 교체 방법: (1) 같은 경로에 파일을 덮어쓰거나, (2) `src/public/js/common/chatbot.js` 최상단의 `CHATBOT_ICON_SRC` 상수 한 줄만 원하는 이미지 경로로 수정.

## 알려진 제한 / 확인 필요
- 대화 스레드가 사용자당 1개뿐이라 "여러 대화 분리"는 지원하지 않는다(v1 범위 밖).
- `get_guide_info`는 정적 문자열이라 `views/guide/index.ejs` 문구가 바뀌면 수동으로 동기화해야 한다.
- 허브 응답 오류/타임아웃(30초)은 502로 매핑(구체 사유는 서버 로그에만 기록).

## 관련 문서
`docs/architecture.md`, `docs/db-schema.md`, `docs/modules.md`, `docs/business-rules.md`, `docs/development.md`.
