# Handoff — Chatbot API Tree UX (2026-07-23)

## Goal
- Remove LLM transport trace(Request/Response/Tool Calls) from end-user chatbot UI.
- Show API document data in chatbot answers as expandable tree:
  - API document -> endpoint -> request fields / response fields.
- Keep click-to-navigate behavior so each tree item jumps to API Reference and highlights target.

## Implemented Changes

### 1) Backend payload for chatbot answers
- File: `src/models/chatbotModel.js`
- `searchApiDocs()` now returns richer endpoint metadata for UI tree rendering:
  - `category`
  - `endpoints[].params` (name/type/required/label/desc)
  - `endpoints[].responseFields` (parsed from `responseExample` JSON as leaf field list with path/type)
- Added helpers:
  - `extractResponseFields()`
  - `collectResponseFields()`
  - `normalizeResponseFieldPath()`

- File: `src/controllers/chatbotController.js`
- `POST /chatbot/message` now includes `apiDocs` in response.
  - `apiDocs` is captured from `search_api_docs` tool result (non-trace UI payload).
  - `trace` is still returned for diagnostics compatibility.

### 2) Frontend chatbot rendering
- File: `src/public/js/common/chatbot.js`
- Removed LLM trace panel rendering from visible chatbot output.
  - (No more user-facing "API 요청/응답 정보(JSON)" section.)
- Added API tree renderer:
  - `renderApiDocTree()`
  - `renderFieldTree()`
  - `toTreeFromPaths()`
- Tree structure:
  - Document node (link)
  - Endpoint node (link)
  - Request field tree (links to `focusType=request-param`)
  - Response field tree (links to `focusType=response-field`)
- Nav token logic updated to use richer endpoint metadata:
  - request params from `ep.params`
  - response fields from `ep.responseFields`
- Assistant message now consumes `messageMeta.apiDocs` and renders tree below text.

### 3) Frontend styling
- File: `src/public/css/chatbot.css`
- Added style set for API tree UI:
  - `.chatbot-api-tree*` classes
  - nested list/card/details visuals

### 4) Documentation sync
- Updated docs:
  - `docs/chatbot.md`
  - `docs/business-rules.md`
  - `docs/modules.md`
  - `docs/backend.md`
- Reflects:
  - trace UI is hidden for end users
  - apiDocs-driven API tree is displayed
  - `/chatbot/message` contract includes `apiDocs`

## Validation
- VS Code diagnostics (`get_errors`) on changed runtime files:
  - `src/public/js/common/chatbot.js`: no errors
  - `src/models/chatbotModel.js`: no errors
  - `src/controllers/chatbotController.js`: no errors

## Known Baseline in Workspace
- `npm start` currently exits 1 (pre-existing in session context).
- `npm run lint` currently exits 1 (pre-existing in session context).

## Recommended Next Checks
1. Runtime UX check in browser:
   - Ask "API 어떤 게 있어?"
   - Confirm no LLM trace panel appears.
   - Confirm API tree appears and expands/collapses.
2. Navigation check:
   - Click endpoint/request/response items.
   - Confirm in-place move to `/api-reference` and row/section highlight works.
3. Data volume check:
   - For very large response examples, verify payload/latency is acceptable.
   - If needed, cap `responseFields` length per endpoint (currently 160).

## Optional Next Enhancement
- Add user-facing toggle to show/hide API tree per answer bubble.
- Add endpoint-level sample JSON preview for request/response (collapsed by default).
