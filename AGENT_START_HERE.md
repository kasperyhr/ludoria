# Ludoria Agent Start Here

This file helps new Codex conversations bootstrap into the Ludoria project safely, especially in Windows/PowerShell environments where Chinese UTF-8 text may appear garbled.

## Encoding Rules

1. All repository text files use UTF-8 without BOM.
2. If Chinese text appears garbled in a PowerShell terminal or editor, **do not rewrite the file**. The actual file content is almost certainly correct.
3. Use `fs.readFileSync(path, 'utf8')` in Node.js, or configure your editor for UTF-8.
4. Run `corepack pnpm check:encoding` before editing documents.
5. Never add UTF-8 BOM to source files.
6. If `check:encoding` reports zero errors, the files are fine — the issue is your display tool.

## First Steps for Any New Conversation

1. Read this file.
2. Read `AGENTS.md` for project-wide rules.
3. Run `corepack pnpm check:encoding` to verify encoding.
4. Read the relevant handoff document for your task:

| Task | Handoff Document |
|------|-----------------|
| Frontend UX | `docs/HANDOFF_FRONTEND_UX.md` |
| New Game | `docs/HANDOFF_GAME_DEVELOPMENT.md` |
| Admin / Security | `docs/HANDOFF_ADMIN_SECURITY.md` |
| Auth / Account | `docs/HANDOFF_AUTH_ACCOUNT.md` |
| Deployment | `docs/HANDOFF_DEPLOYMENT.md` |
| Overview | `docs/HANDOFF_OVERVIEW.md` |
| Phase Plan | `docs/NEXT_PHASE_PLAN.md` |

## Hard Rules (never violate)

- Never commit `wrangler.preview.toml`, `database_id`, `account_id`, API tokens, or secrets.
- Never expose hidden game state, raw session tokens, or Sudoku solution to normal users.
- Never skip `Command -> Validate -> Event -> State -> View` for multiplayer games.
- Never put game rules in React components.
- Never send full `GameState` to the frontend.
- Keep all new files UTF-8 without BOM.

## Quick Quality Commands

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm check:encoding
corepack pnpm check:preview-config
```
