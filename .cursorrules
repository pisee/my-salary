# MySalary — AI Coding Rules

See `AGENTS.md` for full project conventions.

## Critical Rules

### DB Schema Changes
- **NEVER** write SQL (`CREATE TABLE`, `ALTER TABLE`) directly in code
- **ALWAYS** use Drizzle ORM TypeScript schema files in `src/core/db/schema/`
- **ALWAYS** run `npm run db:generate` after schema changes
- See `docs/guide/migrations.md` for full workflow

### Electron
- **Electron 33.3.1 only** — 34+ breaks `require('electron')`
- Main process uses `createRequire` for CJS modules (electron, better-sqlite3, drizzle-orm)
- After `npm install`, run `npx @electron/rebuild` if `better-sqlite3` ABI mismatch occurs

## Behavioral Guidelines

See `docs/rule/andrej-karpathy-skills.md` for core behavioral rules:

- **Think Before Coding** — State assumptions, ask when uncertain, push back on overcomplication
- **Simplicity First** — Minimum code that solves the problem. No speculative features.
- **Surgical Changes** — Touch only what's needed. Don't refactor adjacent code.
- **Goal-Driven Execution** — Define success criteria before implementation. Verify before claiming done.
