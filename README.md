# Ludoria

Ludoria 是一个 Cloudflare-first 的 TypeScript monorepo，用于构建在线 Game Hub：多人桌游和单人益智游戏共存。

Phase 1 让项目从 scaffold 进入 runnable shell：`apps/web` 和 `apps/worker` 都可以本地启动，前端可以调用 Worker 的 health API，并显示来自 Worker 的 mock 游戏目录。

## 工作区

- `apps/web`: Vite + React runnable shell。
- `apps/worker`: Cloudflare Workers + Hono runnable shell。
- `packages/game-engine`: 通用游戏抽象。
- `packages/game-definitions`: 具体游戏定义入口。
- `packages/protocol`: 前后端共享协议类型。
- `packages/db`: 数据库 schema placeholder。
- `packages/ui`: 最小共享 UI primitives。
- `packages/config`: 共享配置 placeholder。

## 安装

当前机器上全局 `pnpm` shim 可能不可用，推荐使用 Corepack：

```powershell
corepack pnpm install
```

如果本机已经能直接运行 `pnpm`，也可以使用：

```powershell
pnpm install
```

## 本地运行

启动 Worker：

```powershell
corepack pnpm dev:worker
```

默认地址是：

```text
http://127.0.0.1:8787
```

启动 Web：

```powershell
corepack pnpm dev:web
```

默认地址是：

```text
http://127.0.0.1:5173
```

Web 默认通过 Vite proxy 把 `/worker-api/*` 转发到 `http://127.0.0.1:8787/*`。如果需要改 Worker 地址，可以设置：

```powershell
$env:LUDORIA_WORKER_ORIGIN="http://127.0.0.1:8787"
```

也可以在前端运行时使用：

```text
VITE_LUDORIA_WORKER_API_URL=/worker-api
```

## 测试 Worker API

```powershell
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/api/games
```

`GET /health` 返回 Phase 1 health 状态，`GET /api/games` 返回 mock 游戏目录。

## 常用命令

```powershell
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm build
```

根目录也提供：

```powershell
corepack pnpm dev
corepack pnpm dev:web
corepack pnpm dev:worker
```

## 架构原则

多人游戏遵循 `Command -> Validate -> Event -> State -> View`，由服务器权威状态生成 `getPlayerView` / `getSpectatorView`。单人 puzzle 遵循 `Puzzle -> Progress -> Move -> Completion`，不能把明文 solution 发给前端。

## 仍然是 mock / placeholder 的内容

- 游戏目录是 Worker 内的 mock 数据。
- 没有真实账号、房间、WebSocket、D1、R2 或 Durable Objects。
- Web 只有基础首页、路由占位、health 状态和游戏目录展示。
- UI primitives 仍保持轻量，未来可向 shadcn/ui 风格扩展。

## 下一阶段

Phase 2 适合实现一个最小 demo multiplayer game，用来验证 `GameSessionActor` 设计、命令流、事件流和安全视角投影。
