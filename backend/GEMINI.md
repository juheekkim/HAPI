# Backend Area Instructions

Scope: server logic. Actual code lives under `src/` (`app.js`, `config/`, `routes/`, `controllers/`, `models/`, `middlewares/`, `scripts/`). This folder holds only AI instructions.
Root instructions in `/CLAUDE.md` (and `/AGENTS.md`, `/GEMINI.md`) take priority over this file.

## Before You Edit
- Read `docs/backend.md`, `docs/business-rules.md`, `docs/api.md`, and `docs/auth.md`.
- Inspect the existing controller/model/middleware structure and reuse current patterns.
- Business rules in `docs/business-rules.md` are authoritative — confirm them before changing logic.
- Check `team-ownership.md`: routes/controllers are split per developer (home, guide, apiReference, support, admin). Edit only your area.

## Key Facts (source of truth = code)
- Layered flow: `routes -> controllers -> models -> DB`. There is no separate service/dao layer — `models/*` are the data-access layer using the shared `pg` Pool (`config/database.js`).
- Auth: session-based (`express-session`). `middlewares/isAuthenticated.js` guards all menu routes; `middlewares/isAdmin.js` guards `/admin`. `role` values in use: `admin`, `partner` (schema comment says `user`).
- Controllers render EJS and pass `{ title, currentMenu, ... }`; async handlers wrap DB calls in try/catch and log errors.
- Many models return **STATIC fallback data** when the DB is unavailable — preserve this pattern when adding read queries.
- Passwords hashed with `bcrypt`. Partner login: `username = partner_code`, initial password = `partner_code`.

## Rules
- Follow ESLint + Prettier (`coding-convention.md`), `'use strict'`, `eqeqeq`, `const`/`let`.
- Common areas (`app.js`, `config/`) require team agreement before change.
- When API, service, batch, or integration behavior changes, update `docs/backend.md`/`docs/api.md` (and `docs/business-rules.md` if rules change) in the same change.
- Never commit secrets; use `.env`. Keep code/DB/API/table/column/file identifiers unchanged. Instruct AI in English; Korean is fine for domain notes.
