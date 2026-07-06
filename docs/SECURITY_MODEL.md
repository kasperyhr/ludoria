# Security Model

## Hidden Information

Multiplayer games must keep hidden state (tokens, hands, private roles) server-authoritative. Clients receive only role-safe views through getPlayerView and getSpectatorView.

## D1 Metadata Safety

- D1 game_sessions stores session index metadata only (counts, status, timestamps). Never stores the full authoritative GameState.
- D1 session_players stores display names and roles. Never stores hidden tokens, hands, or private information.
- D1 puzzle_progress stores player-filled cells as JSON. Never stores Sudoku solutions.
- D1 never stores raw session tokens. If tokens are referenced, only SHA-256 hashes are stored.
- D1 writes are best-effort. If a D1 write fails, the game operation continues and a warning is logged.

## Preview Deployment Security

- `wrangler.preview.toml` (contains real database_id) is gitignored and never committed.
- `apps/worker/wrangler.toml` uses local placeholder database_id only.
- No Cloudflare API token, account_id, or database_id is committed to the repository.
- Check with: `corepack pnpm check:preview-config`

## Preview URL

The preview Worker is at a public `workers.dev` URL. No secrets or hidden game state are accessible through public endpoints. The Worker never returns:
- Full multiplayer GameState
- Other players' hidden tokens
- Sudoku solutions
- Raw session tokens

## Automated Security Scans

- `corepack pnpm test` -- runs `security-scan.test.mjs` checking D1 schema/migrations for forbidden fields
- `corepack pnpm check:preview-config` -- scans committed files for real secrets/IDs
- `corepack pnpm smoke:preview` -- verifies spectator hiddenTokens safety against deployed Worker

## Session Token Lifecycle

- Session tokens are generated on join and returned to the client once.
- DO storage snapshots contain only SHA-256 hashes.
- WebSocket hibernation attachments contain only token hashes.
- Tokens expire after 24 hours.
- Logs must never output raw session tokens.

## Do Not Trust the Frontend

- React components display views but never enforce game rules.
- Game rules live in packages/game-definitions.
- Protocol validation uses Valibot schemas from packages/protocol.
- The Worker never sends full hidden GameState or Sudoku solutions to clients.

## Rollback Safety

When rolling back:
- Never commit or expose secrets during rollback.
- D1 backups are captured automatically on migration apply.
- Previous Worker versions are available via Cloudflare Dashboard.
