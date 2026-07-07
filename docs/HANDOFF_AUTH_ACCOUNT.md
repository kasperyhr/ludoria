English summary:
This document is the handoff guide for authentication and account features. Ludoria currently has no real account system — sessionStorage tokens are demo-only. Future work includes Google OAuth login, player account pages, and reconnecting to active games.

---

# Handoff: Auth & Account

## 当前状态

**当前没有真实账号系统。** 当前 `sessionStorage` token 只是 demo 机制，不持久化、不可跨设备。

## 未来账户系统目标

### 普通玩家登录后应能看到：

- 正在进行的游戏
- 最近对局
- 单人 puzzle progress
- 是否回到刚才对局

### 断线重连

未来应从账户 active sessions 恢复，而不是仅靠 sessionStorage demo token。

### 登录方式

- Google 登录：第一阶段
- 微信登录：后续可选项

## Auth 安全规则

- Auth 不应直接暴露 admin 权限
- Admin 权限必须走 RBAC
- 不要把 OAuth secret 提交到 repo
- session token / auth token / room token 三者独立

## 未来需要的 D1 Tables

- `users` — 用户基本信息
- `identities` — OAuth 身份关联
- `user_sessions` — 登录会话
- `account_game_sessions` — 用户-游戏关联

## 推荐 Phase 拆分

1. User table + Google OAuth login
2. Session management
3. Player account page (正在进行/最近对局/puzzle progress)
4. WebAuth / 微信登录
5. Account linking
