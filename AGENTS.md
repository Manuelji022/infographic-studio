<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

Package manager is pnpm, pinned by `packageManager` in `package.json`.

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Generate a migration after changing `db/schema.ts`: `pnpm db:generate`
- Tests: no runner yet. See the testing approach below.

Run the typecheck and lint before reporting work as done, and paste the output as evidence.

## Testing approach

- End-to-end tests are the only test mechanism. Each one verifies that a complete feature works.
- Never write unit tests after the code they cover.
- If a system must be tested in isolation first, list every way it could fail before writing the code.
- End-to-end runs must produce a repeatable, verifiable artifact, such as a report or recorded output that someone can re-check.

## Gotchas

- Don't hand-edit the SQL in `drizzle/`. Change `db/schema.ts`, then run `pnpm db:generate`.
- Environment variables are listed in `.env.example`. All `.env*` files are gitignored. Never copy their values into code, committed files, or this file.