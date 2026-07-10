# Root Instructions

These instructions have priority over all lower-level instructions.

## Hierarchy

Follow root first. Apply area/path/override rules only if they don't conflict with root.

## Project

HAPI = 리조트 API 플랫폼 포털. Node.js/Express, EJS, PostgreSQL (pg Pool). Flow: routes -> controllers -> models -> DB.

## Required References

Before editing, read: docs/architecture.md, docs/db-schema.md, docs/business-rules.md, docs/modules.md, docs/development.md.
Then read the area file for your work: frontend/, backend/, or db/ (CLAUDE.md / AGENTS.md / GEMINI.md).

## Documentation Rule

When code changes or new facts are found, update related md files. If docs are insufficient, add a new file under docs/.

## Language Rule

Instruct AI in English. Korean is fine for business notes. Keep code/DB/API/table/column/file identifiers unchanged.

## Maintenance

Source code is the source of truth. Keep root files compact; details under docs/. Keep CLAUDE.md, AGENTS.md, GEMINI.md, Copilot synced.
