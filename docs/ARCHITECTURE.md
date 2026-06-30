# Architecture

## 总体架构

Ludoria 是 Cloudflare-first TypeScript monorepo。前端在 `apps/web`，BFF/Worker 在 `apps/worker`，共享游戏抽象、协议、数据库 schema 和 UI 分别放在 `packages/*`。

Phase 1 的重点是 runnable shell：

- `apps/web` 是 Vite + React 本地前端。
- `apps/worker` 是 Cloudflare Workers + Hono 本地 Worker。
- `packages/protocol` 提供 `HealthResponse`、`GameCatalogItem`、`ApiError` 等共享类型。
- `packages/ui` 提供轻量 `Button`、`Card`、`Badge` primitives。

## 为什么 Cloudflare-first

目标运行时是 Workers、Durable Objects、D1 和 R2。这样可以让实时会话靠近用户，并把平台数据、会话状态和静态资源拆到清晰边界。Phase 1 只做本地 runnable shell，不创建任何真实 Cloudflare 资源。

## 为什么使用 GameSessionActor

多人房间需要一个服务器权威状态机。未来每个房间对应一个 `GameSessionActor`，负责 WebSocket、玩家座位、观战者、断线重连、TTL、idle check 和事件流。

Phase 1 不实现完整 `GameSessionActor`，只建立 web 与 worker 的联调方式。

## 多人游戏和单人 puzzle 的区别

多人游戏处理隐藏信息和多人同步，必须走 `Command -> Validate -> Event -> State -> View`。单人 puzzle 更关注题目、进度、移动和完成检查，遵循 `Puzzle -> Progress -> Move -> Completion`。

## Phase 1 数据流

```text
apps/web -> Vite proxy /worker-api -> apps/worker -> mock JSON
```

当前前端会调用：

- `GET /health`: 显示 Worker 状态。
- `GET /api/games`: 显示 mock 游戏目录。

这些响应类型来自 `packages/protocol`，避免 web 和 worker 重复定义协议。

## WebSocket 流程

WebSocket 仍是 Phase 2+ 的工作。未来客户端加入 session 后建立 WebSocket，Actor 返回初始视角。后续命令、聊天和 heartbeat 都通过协议消息传输，Actor 只广播允许公开的事件和视角更新。

## 断线重连流程

断线重连仍是 placeholder。未来客户端保存 session token。重连时发送 `RECONNECT`，Actor 验证 token、恢复座位或观战身份，并重新发送当前视角。
