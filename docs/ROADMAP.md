# Roadmap

## Phase 0: bootstrap

建立 monorepo、文档、规则、skills 和 placeholder。

## Phase 1: runnable shell

让 web 和 worker 都能本地运行，建立基础导航、health API、mock 游戏目录和共享协议类型。

## Phase 2: demo multiplayer game

实现 Token Bluffing Demo，用于验证 `GameSessionActor` placeholder、WebSocket、命令校验、事件流、服务器权威状态和安全 view projection。

## Phase 3: demo solo puzzle

实现 Sudoku 或 Nonogram demo，验证 `Puzzle -> Progress -> Move -> Completion`、progress autosave、hint、completion check、unique solution verification 和 solution hash。

## Phase 4: Cloudflare integration

把本地 `GameSessionActor` placeholder 迁移到 Durable Objects，接入 D1、R2 和 Wrangler 部署流程。

## Phase 5: polish UI

打磨 premium board game lounge 风格、响应式布局和动效。

## Phase 6: real games

逐步加入真实多人桌游和单人益智游戏。
