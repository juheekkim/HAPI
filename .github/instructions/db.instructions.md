---
applyTo: "db/scripts/**,src/models/**"
---

# DB Area Instructions

Scope: schema and queries. DDL/DML live under `db/scripts/**` (numbered prefix); query modules live under `src/models/**`. This folder holds only AI instructions.
Root instructions in `/CLAUDE.md` (and `/AGENTS.md`, `/GEMINI.md`) take priority over this file.

## Before You Edit
- Read `docs/db-schema.md` (and for the product you use, the matching `db/AGENTS.md` / `db/CLAUDE.md` / `db/GEMINI.md` / `.github/instructions/db.instructions.md`).
- Inspect existing scripts and model queries; reuse current naming and patterns.

## Key Facts (source of truth = code)
- Driver: `pg` Pool shared via `src/config/database.js`. Connection from `DATABASE_URL`.
- Tables: `users`, `partners`, `firewall_requests`, `notices`, `inquiries`, `api_specs`, `partner_firewall_applies`. See `docs/db-schema.md` for columns/relations.
- Scripts are cumulative and numbered (`01_`, `02_`, `07_`, `16_`, ... gaps exist). **Do not modify existing scripts** — add a new higher-numbered script for any change.
- `api_specs.endpoints`/`error_codes` are JSONB. Timestamps are `TIMESTAMPTZ`.
- Admin account via `npm run db:setup` (`admin`/`admin123`). Partner accounts: `username = partner_code`.

## Rules
- Document every table/column/query meaning; when you learn a new fact during analysis, record it in `docs/db-schema.md`.
- Note performance, index, join, and permission concerns in `docs/db-schema.md` when found (existing indexes are listed there).
- `db/scripts/**` is a common area — coordinate with the team before adding scripts.
- Use parameterized queries (`$1, $2, ...`) only; never string-concatenate SQL.
- Keep table/column/identifier names unchanged. Instruct AI in English; Korean is fine for domain notes.
