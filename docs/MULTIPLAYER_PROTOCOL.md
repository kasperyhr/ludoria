# Multiplayer Protocol

Phase 2 补齐了最小 WebSocket 协议类型。类型定义位于 `packages/protocol`，web 和 worker 必须共享引用，不允许重复定义。

## REST

### POST /api/sessions

创建 `token-bluffing-demo` session。

### POST /api/sessions/:sessionId/join

请求体：

```json
{
  "displayName": "Alice",
  "role": "player"
}
```

`role` 可以是 `player` 或 `spectator`。返回 `sessionToken` 和 WebSocket URL。

### GET /api/sessions/:sessionId/connect

使用 `token` query 参数升级为 WebSocket。

## Client to Server

- `JOIN_SESSION`: 保留给 WebSocket 内部加入流程。
- `RECONNECT`: 使用 session token 重新获取 snapshot。
- `SUBMIT_COMMAND`: 提交 `DECLARE_TOKEN_COUNT`。
- `CHAT_MESSAGE`: 公共聊天。
- `HEARTBEAT`: 保持连接并请求 snapshot。

## Server to Client

- `SESSION_SNAPSHOT`: 连接后发送初始安全视角。
- `PLAYER_VIEW_UPDATE`: 发送给玩家的安全视角。
- `SPECTATOR_VIEW_UPDATE`: 发送给观战者的安全视角。
- `PUBLIC_EVENT`: 不含隐藏 token 的公共事件。
- `CHAT_MESSAGE`: 公共聊天消息。
- `ERROR`: 协议或命令错误。

## Validation

Phase 2 只有最小 runtime validation：检查消息可解析、类型存在、join body 基本合法。后续应补 Zod 或 Valibot schema，并让测试覆盖 schema 与 TypeScript 类型的一致性。
