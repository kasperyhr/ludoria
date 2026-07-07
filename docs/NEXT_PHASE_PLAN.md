English summary:
This document outlines the recommended next development phases for Ludoria, from Phase 10A (UX cleanup) through Phase 15 (Pages migration). Each phase includes goals, exclusions, affected files, security risks, and completion criteria.

---

# Next Phase Plan

## Phase 10A: Public Game Hall UX Cleanup

**目标**：按 `HANDOFF_FRONTEND_UX.md` 中的 Immediate UX Cleanup 清单修复首页和导航问题。
**不做什么**：不改后端、不改游戏规则。
**涉及文件**：`apps/web/src/pages/HomePage.tsx`, `AppLayout.tsx`, `HealthStatus.tsx`, `styles.css`
**安全风险**：无。
**完成标准**：首页不再展示 Worker 状态/Phase/技术术语，导航优化。

## Phase 10B: Player-Friendly Room Codes

**目标**：Session ID 改名"房间号"，增加邀请链接复制，房间号更短更易读。
**不做什么**：不改 DO/WebSocket 逻辑。
**完成标准**：玩家可以用短房间码加入对局。

## Phase 11: Auth & Account Foundation

**目标**：实现 Google OAuth 登录、用户表、session 管理。
**不做什么**：不做 Admin、不做微信登录。
**涉及文件**：`apps/worker/src/routes/`, `packages/db/src/schema.ts`
**安全风险**：OAuth secret 泄露、token 管理。
**完成标准**：用户可以 Google 登录，看到自己的对局。

## Phase 12: Admin Moderation Console

**目标**：Admin 身份、RBAC、封禁、audit log。
**不做什么**：不做公开 Admin API。
**安全风险**：权限泄露、horizontal privilege escalation。
**完成标准**：Admin 可以封禁玩家、查看 audit log。

## Phase 13: Admin Review View / Room Inspection

**目标**：Admin 可以查看完整房间状态（review projection，不含对玩家直播）。
**不做什么**：不让普通玩家访问。
**安全风险**：hidden state 可能通过 admin view 泄露。
**完成标准**：Admin 可查看但普通玩家不可。

## Phase 14: First Real Multiplayer Board Game (e.g. Werewolf)

**目标**：基于现有 GameSessionActor 实现第一个真实多人桌游。
**不做什么**：不重写引擎。
**涉及文件**：`packages/game-definitions/`, `apps/web/`
**安全风险**：hidden role/token 泄露。
**完成标准**：完整可玩对局，安全视角正确。

## Phase 15: Cloudflare Pages Migration

**目标**：`apps/web` 迁移到 Cloudflare Pages，Worker 保留为 API 后端。
**不做什么**：不改变部署架构的 DO/D1 部分。
**安全风险**：CORS misconfiguration。
**完成标准**：Pages 服务 UI，Worker 服务 API，`VITE_LUDORIA_API_ORIGIN` 正确配置。
