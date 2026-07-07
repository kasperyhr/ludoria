English summary:
This document is the handoff guide for admin/moderation/security features. Admin is a future system — not yet implemented. All admin access must be server-enforced, never frontend-hidden. Includes moderation tables, ban policies, and phase plan for admin console.

---

# Handoff: Admin & Security

## 重要声明

Admin 系统是未来独立大系统，**当前尚未实现**。以下内容为指导未来开发的 handoff。

## 核心安全原则

- Admin 权限不能只靠前端隐藏按钮或 toggle
- 所有 admin 权限必须后端强制验证
- 普通玩家永远不能通过前端开关获得 admin data
- Admin review view 必须是独立 server-side projection
- Admin 全见视角必须有 audit log
- Admin 查看房间、删除房间、封禁玩家/IP 都必须经过权限校验

## 封禁策略

支持以下封禁时长：

- 1 hour
- 1 day
- 7 days
- 30 days
- custom

## 未来需要的 D1 Tables

- `admin_users` — admin 身份
- `user_roles` — RBAC 角色
- `moderation_actions` — 管理操作记录
- `bans` — 封禁记录
- `audit_logs` — 审计日志

## Admin 操作安全规则

- Admin 不能破坏正常玩家视角
- Admin 操作不应把 hidden state 明文写入 D1
- Admin 全见视角仅在 admin review 接口返回
- Admin 操作必须记录 audit log

## 推荐 Phase 拆分

1. Admin 身份和基本 RBAC
2. Room 列表和 inspection
3. Player 管理和封禁
4. Audit log
5. Admin console UI
