# Security Model

## Hidden Information

Multiplayer games must keep hidden state (tokens, hands, private roles) server-authoritative. Clients receive only role-safe views through getPlayerView and getSpectatorView.

## D1 Metadata Safety

Phase 5 introduces a D1 metadata layer. The following rules apply:

- D1 game_sessions stores session index metadata only (counts, status, timestamps). It never stores the full authoritative GameState.
- D1 session_players stores display names and roles. It never stores hidden tokens, hands, or private information.
- D1 puzzle_progress stores player-filled cells as JSON. It never stores Sudoku solutions.
- D1 never stores raw session tokens. If tokens are referenced, only SHA-256 hashes are stored.
- D1 writes are best-effort. If a D1 write fails, the game operation continues and a warning is logged.

## Session Token Lifecycle

- Session tokens are generated on join and returned to the client once.
- DO storage snapshots contain only SHA-256 hashes of session tokens.
- WebSocket hibernation attachments contain only token hashes, never raw tokens.
- Tokens expire after 24 hours. Revoked tokens are rejected on connect.

## Do Not Trust the Frontend

- React components display views but never enforce game rules.
- Game rules live in packages/game-definitions.
- Protocol validation uses Valibot schemas from packages/protocol.
- The Worker never sends full hidden GameState or Sudoku solutions to clients.
