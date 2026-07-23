# AI 어시스턴트 (/assistant) — 실험 기능

> Source of truth is the code. 실험적 컨셉 검증용 모듈 — "로그인하면 메뉴를 찾아다니는 대신
> AI 대화로 바로 필요한 정보를 확인한다"를 별도 대메뉴로 시험한다(홈 화면 대체 아님).

## 위치
`routes/assistant.js`(isAuthenticated) → `controllers/assistantController.js` →
`views/assistant/index.ejs` + `public/js/assistant.js` + `public/css/assistant.css`.
메뉴: `db/scripts/46_add_assistant_menu.sql` — `menus`에 top-nav `AI 어시스턴트`(`/assistant`,
`display_order` 6) 신설, `role_menus`는 모든 역할에 매핑(제한 필요 시 `/admin/roles`에서 조정).

## 화면 구성 (2열)
- **좌: 대화 영역** — 상단 툴바(새 대화) + 메시지 리스트 + 입력 폼.
  진입 시 히어로(추천 정보)가 메시지 리스트 상단에 상시 노출:
  - 추천 질문 칩(정적 목록, 클릭 시 바로 전송)
  - 역할별 API 문서 카드(`menuModel.getApiSidebarByRole` 트리를 평탄화 — 파트너는
    `partnerModel.getRoleCodeById`가 세션 role 대체, `chatbotModel.resolveAllowedDocs`와 동일 규칙)
  - 내 지원 현황(`chatbotModel.getMySupportStatus` — 문의/방화벽 신청 각 3건)
  - 최근 공지 3건(`chatbotModel.getNotices`) + 시작하기 가이드 링크
- **우: 문서 사이드 패널**(기본 숨김) — nav 링크 클릭 시 API Reference 부분화면을 주입.

## 기존 챗봇 재사용 관계 (중요)
- **백엔드 신규 없음**: 대화는 기존 `/chatbot/{history,message,clear}` 그대로 사용(이력도 위젯과 공유).
- **렌더링 재사용**: `chatbot.js`가 IIFE 끝에서 `window.HapiChatbotShared =
  { renderAssistantMessageContent }`를 노출 → `assistant.js`가 답변 버블(마크다운/API 트리/nav 링크)
  렌더에 그대로 사용. 버블/트리 스타일은 `chatbot.css`의 `.chatbot-*` 클래스 재사용.
- **플로팅 위젯 숨김**: `assistant.js`가 `body.assistant-page` 클래스를 붙이고
  `assistant.css`가 `.assistant-page .chatbot-widget { display:none }` 처리(중복 대화 채널 방지).
- **로드 순서**: `assistant.js`는 `defer`라 레이아웃 하단의 `chatbot.js`(공유 렌더러 제공)보다
  나중에 실행됨이 보장된다.

## 우측 패널 동작 (in-place 부분 렌더, iframe 아님)
- 답변 트리/본문/추천 카드의 링크는 모두 `a[data-chatbot-nav="api-reference"]` —
  `chatbot.js`의 문서 클릭 핸들러는 `window.__hapiAssistantActive` 가드로 이 페이지에서 양보하고,
  `assistant.js`의 핸들러가 `?_partial=1`로 부분화면을 받아 `#assistant-panel-body`에 주입한다
  (innerHTML 스크립트는 재생성해 실행 — `navigateApiReferenceInPlace`와 동일 기법).
- 포커스/하이라이트: `apiReference/index.ejs`의 `applyApiReferenceFocusFromLocation(search)`가
  선택적 `search` 인자를 받도록 일반화됨 — 패널처럼 주소가 안 바뀌는 문맥에서 클릭 링크의
  쿼리로 포커스한다(무인자 호출은 기존과 동일하게 `location.search` 사용).
  스크롤은 `getScrollContainer`가 패널 안 `.api-content`를 찾아 동일하게 동작.
- 같은 doc 재클릭 시 재요청 없이 포커스만 갱신(스크롤 위치 보존). 패널 로드 실패 시 새 탭 폴백.
- 패널 안에서는 `.api-sidebar`를 숨기고 `.api-layout`을 패널 높이(100%)로 오버라이드.

## 접근/보안
- `isAuthenticated` 필수. 데이터 조회는 전부 세션 사용자 기준(역할별 문서, 본인 지원 현황).
