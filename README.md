# Ludoria

Ludoria 是一个 Cloudflare-first 的 TypeScript monorepo，用于构建在线 Game Hub：多人桌游和单人益智游戏共存。

Phase 2 在 runnable shell 上加入了最小多人隐藏信息 demo：`Token Bluffing Demo`。它用于验证服务器权威状态、WebSocket、`Command -> Validate -> Event -> State -> View` 流程，以及 `getPlayerView` / `getSpectatorView` 的安全视角投影。

## 工作区

- `apps/web`: Vite + React runnable shell 和 multiplayer demo UI。
- `apps/worker`: Cloudflare Workers + Hono runnable shell、本地 session API、WebSocket 入口和 `GameSessionActor` placeholder。
- `packages/game-engine`: 通用 multiplayer engine contract。
- `packages/game-definitions`: `token-bluffing-demo` 最小规则实现。
- `packages/protocol`: 前后端共享 REST/WebSocket 协议类型。
- `packages/db`: 数据库 schema placeholder。
- `packages/ui`: 轻量 UI primitives。
- `packages/config`: 共享配置 placeholder。

## 安装

```powershell
corepack pnpm install
```

## 本地运行

启动 Worker：

```powershell
corepack pnpm dev:worker
```

默认地址：

```text
http://127.0.0.1:8787
```

启动 Web：

```powershell
corepack pnpm dev:web
```

默认地址：

```text
http://127.0.0.1:5173
```

Web 默认通过 Vite proxy 把 `/worker-api/*` 转发到 `http://127.0.0.1:8787/*`。WebSocket 重连默认使用：

```text
ws://127.0.0.1:8787
```

可以通过 `.env` 或 shell 环境覆盖：

```powershell
$env:LUDORIA_WORKER_ORIGIN="http://127.0.0.1:8787"
$env:VITE_LUDORIA_WORKER_API_URL="/worker-api"
$env:VITE_LUDORIA_WORKER_WS_URL="ws://127.0.0.1:8787"
```

## 测试 API

```powershell
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/games
```

创建 session：

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions
```

加入 session：

```powershell
curl -X POST http://127.0.0.1:8787/api/sessions/<sessionId>/join `
  -H "Content-Type: application/json" `
  -d "{\"displayName\":\"Alice\",\"role\":\"player\"}"
```

## 如何测试 Token Bluffing Demo

1. 启动 Worker 和 Web。
2. 打开 `http://127.0.0.1:5173`，在游戏目录点击 `Token Bluffing Demo`。
3. 在第一个浏览器窗口创建 session，并作为玩家加入。
4. 复制 session id，在第二个浏览器窗口作为另一个玩家加入。
5. 在第三个浏览器窗口使用同一个 session id，作为观战者加入。
6. 玩家可以看到自己的隐藏 token，但只能看到其他玩家的 token 数量。
7. 观战者只能看到玩家列表、token 数量、公共事件和公共聊天，看不到任何隐藏 token 种类。
8. 玩家可以提交 `DECLARE_TOKEN_COUNT`，所有连接会收到 public event 和安全视角更新。

## 常用命令

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

## 架构原则

多人游戏遵循 `Command -> Validate -> Event -> State -> View`。完整隐藏状态只存在服务器权威状态中，前端永远只接收 `getPlayerView` 或 `getSpectatorView` 生成的视角。

## 仍然是 mock / placeholder 的内容

- `GameSessionActor` 是本地内存 placeholder，不是正式 Durable Object 持久化实现。
- 没有真实账号系统、完整大厅、完整房间生命周期、胜负逻辑、D1、R2 或真实 Durable Objects 资源。
- WebSocket protocol 只有最小 runtime validation，后续应补 Zod 或 Valibot schema。
- `Token Bluffing Demo` 只验证隐藏信息和命令流程，不是完整桌游。

## 下一阶段

Phase 3 适合实现一个最小 solo puzzle demo，例如 Sudoku 或 Nonogram，用来验证 `Puzzle -> Progress -> Move -> Completion`、autosave、hint、completion check 和 solution hash。
