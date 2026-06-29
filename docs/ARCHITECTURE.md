# Architecture

## 总体架构

Ludoria 是 Cloudflare-first TypeScript monorepo。前端在 `apps/web`，BFF/Worker 在 `apps/worker`，共享游戏抽象、协议、数据库 schema 和 UI 分别放在 `packages/*`。

## 为什么 Cloudflare-first

目标运行时是 Workers、Durable Objects、D1 和 R2。这样可以让实时会话靠近用户，并把平台数据、会话状态和静态资源拆到清晰边界。Phase 0 不创建任何真实资源。

## 为什么使用 GameSessionActor

多人房间需要一个服务器权威状态机。未来每个房间对应一个 `GameSessionActor`，负责 WebSocket、玩家座位、观战者、断线重连、TTL、idle check 和事件流。

## 多人游戏和单人 puzzle 的区别

多人游戏处理隐藏信息和多人同步，必须走 `Command -> Validate -> Event -> State -> View`。单人 puzzle 更关注题目、进度、移动和完成检查，遵循 `Puzzle -> Progress -> Move -> Completion`。

## 数据流

客户端提交命令，Worker/Actor 校验并产生事件，事件更新权威状态，再生成 player view 或 spectator view。数据库只保存平台级数据、进度和结果摘要。

## WebSocket 流程

客户端加入 session 后建立 WebSocket，Actor 返回初始视角。后续命令、聊天和 heartbeat 都通过协议消息传输，Actor 只广播允许公开的事件和视角更新。

## 断线重连流程

客户端保存 session token。重连时发送 `RECONNECT`，Actor 验证 token、恢复座位或观战身份，并重新发送当前视角。
