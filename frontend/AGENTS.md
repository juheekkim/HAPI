# Frontend Area Instructions

Scope: server-rendered UI. Actual code lives under `src/views/**` (EJS) and `src/public/**` (css/js). This folder holds only AI instructions.
Root instructions in `/CLAUDE.md` (and `/AGENTS.md`, `/GEMINI.md`, `/CODEX.md`) take priority over this file.

## Before You Edit
- Read `docs/frontend.md`, `docs/modules.md`, and `docs/menu-routing.md`.
- Inspect existing structure and reuse current patterns before adding anything new.
- Check `team-ownership.md`: views are split per developer (`home`, `guide`, `apiReference`, `support`, `admin`). Edit only your area; read others for reference.

## Key Facts (source of truth = code)
- Templating: EJS + `express-ejs-layouts`. Default layout is `views/layouts/main.ejs`; auth pages render with `layout: false`.
- Every page render passes `title` and `currentMenu`. `res.locals.user` is injected app-wide (see `src/app.js`) and read by `views/partials/header.ejs` for nav + admin visibility.
- Menus: HOME, 시작하기(guide), API(api-reference), 운영 지원(support), 관리자(admin, admin-only). All require login except `auth/*`.
- Static assets served from `src/public` at web root (`/css`, `/js`).
- All browser API calls MUST go through `public/js/common/apiClient.js` (`apiClient.get/post/put/delete`). Do not call `fetch()` directly.

## Rules
- Follow ESLint + Prettier (`coding-convention.md`).
- Common areas (`views/layouts/**`, `views/partials/**`, `public/*/common*`) require team agreement before change.
- When a screen, menu, or portal branch changes, update `docs/modules.md` and `docs/business-rules.md` in the same change.
- Keep code/DB/API/table/column/file identifiers unchanged. Instruct AI in English; Korean is fine for UI copy and domain notes.
