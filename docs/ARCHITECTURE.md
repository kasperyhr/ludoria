# Architecture

## 总体架构

Ludoria 是 Cloudflare-first TypeScript monorepo。前端在 `apps/web`，Worker/BFF 在 `apps/worker`，共享游戏抽象、游戏定义、协议、数据库 schema 和 UI 分别放在 `packages/*`。

Phase 2 的 runnable shell 包含：

- `apps/web`: 本地 React UI、游戏目录和 Token Bluffing Demo 页面。
- `apps/worker`: Hono Worker、session REST API、WebSocket connect endpoint 和本地 `GameSessionActor` placeholder。
- `packages/game-engine`: 通用 multiplayer engine contract。
- `packages/game-definitions`: `token-bluffing-demo` 规则、视角投影和隐藏信息测试。
- `packages/protocol`: REST 与 WebSocket 共享类型。

## 为什么 Cloudflare-first

目标运行时仍是 Workers、Durable Objects、D1 和 R2。Phase 2 没有创建真实 Cloudflare 资源，也没有部署。当前 `GameSessionActor` 是本地内存 placeholder，用来验证接口形状和信息边界；后续可以迁移到 Durable Objects。

## 为什么使用 GameSessionActor

多人房间需要服务器权威状态机。`GameSessionActor` 负责 session state、玩家/观战者连接、WebSocket message handling、命令校验、事件应用和视角广播。

当前 demo 的关键职责：

1. 创建 session。
2. 加入玩家或观战者。
3. 玩家加入后发放隐藏 token。
4. 接收 `SUBMIT_COMMAND` 和 `CHAT_MESSAGE`。
5. 使用游戏定义生成 player view 或 spectator view。
6. 广播 public event 和安全视角更新。

## Command -> Validate -> Event -> State -> View

`Token Bluffing Demo` 的流程：

```text
Client SUBMIT_COMMAND
  -> tokenBluffingDemoDefinition.validateCommand
  -> public GameEvent
  -> tokenBluffingDemoDefinition.applyEvent
  -> getPlayerView / getSpectatorView
  -> WebSocket update
```

React 组件不实现核心规则；API route handler 不堆复杂规则；规则在 `packages/game-definitions`。

## 多人游戏和单人 puzzle 的区别

多人游戏处理隐藏信息、多人同步和服务器权威状态。单人 puzzle 更关注题目、进度、移动和完成检查，遵循 `Puzzle -> Progress -> Move -> Completion`。Phase 3 会进入 solo puzzle demo。

## Phase 2 数据流

```text
apps/web
  -> REST /worker-api/api/sessions
  -> REST /worker-api/api/sessions/:sessionId/join
  -> WebSocket /api/sessions/:sessionId/connect
  -> GameSessionActor placeholder
  -> token-bluffing-demo rules
  -> safe player/spectator views
```

## WebSocket 流程

1. Web 创建 session。
2. 用户以 player 或 spectator 加入 session，拿到 `sessionToken`。
3. Web 使用 token 连接 WebSocket。
4. Worker 发送 `SESSION_SNAPSHOT`。
5. 玩家发送 `SUBMIT_COMMAND` 或 `CHAT_MESSAGE`。
6. Actor 广播 `PUBLIC_EVENT`、`PLAYER_VIEW_UPDATE` 或 `SPECTATOR_VIEW_UPDATE`。

## 断线重连流程

当前重连使用 session token 重新连接同一个 WebSocket endpoint。Actor 会根据 token 找回 participant，并重新发送 snapshot。过期、轮换和持久化仍是 placeholder。
