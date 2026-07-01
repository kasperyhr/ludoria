# Multiplayer Protocol

Multiplayer protocol types live in `packages/protocol`. Web and Worker code must import shared types from that package instead of redefining request or WebSocket shapes locally.

## Durable Object Routing

Phase 4A routes every Token Bluffing session to a deterministic Durable Object:

```text
sessionId -> GAME_SESSION_OBJECT.idFromName(sessionId) -> GameSessionObject
```

The Worker route module owns public HTTP paths. The Durable Object owns authoritative session state, participant token hashes, WebSocket connections, command handling, chat, heartbeat, and reconnect snapshots.

## REST

### POST /api/sessions

Creates a `token-bluffing-demo` session and initializes a `GameSessionObject`.

### POST /api/sessions/:sessionId/join

Request body:

```json
{
  "displayName": "Alice",
  "role": "player"
}
```

`role` can be `player` or `spectator`. The response includes `sessionToken` and a WebSocket URL.

### GET /api/sessions/:sessionId/connect

Uses the `token` query parameter to upgrade to WebSocket. The token is issued by the join endpoint.

## Client to Server

- `JOIN_SESSION`: retained for internal protocol compatibility; current join flow is REST-first.
- `RECONNECT`: simplified to `{ "type": "RECONNECT" }`; the WebSocket URL already carries the session token.
- `SUBMIT_COMMAND`: submits `DECLARE_TOKEN_COUNT`.
- `CHAT_MESSAGE`: sends public chat.
- `HEARTBEAT`: requests a fresh snapshot.

## Server to Client

- `SESSION_SNAPSHOT`: initial safe view after connect or reconnect.
- `PLAYER_VIEW_UPDATE`: safe player view.
- `SPECTATOR_VIEW_UPDATE`: safe spectator view.
- `PUBLIC_EVENT`: public event without hidden token state.
- `CHAT_MESSAGE`: public chat message.
- `ERROR`: protocol or command error.

## Validation

Valibot schemas in `packages/protocol` validate join bodies and WebSocket client messages. Invalid payloads become `ApiError` responses or WebSocket `ERROR` messages before reaching game logic.

## Hidden Information

`GameSessionObject` continues to use `getPlayerView` and `getSpectatorView`. Full `TokenBluffingState` must never be serialized to the frontend.

## Snapshot Recovery

Phase 4B stores a minimal Durable Object snapshot at `session:snapshot`. The snapshot stores authoritative game state, participant records, token hashes, token expiry, optional revocation time, and recent chat messages.

The snapshot does not store raw session tokens. On connect, the Durable Object hashes the token from the WebSocket URL and matches it against the stored hash. Expired or revoked tokens return `UNAUTHORIZED` before WebSocket upgrade.
