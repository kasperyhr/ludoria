English summary:
This document is the handoff guide for frontend UX work. It contains concrete user feedback on the current UI and categorizes improvements into immediate cleanup, future features, and things not to do yet. The existing Token Bluffing and Sudoku Lite demos may be hidden or recategorized later.

---

# Handoff: Frontend UX

## Immediate UX Cleanup

以下问题应在下一轮 UI 工作中优先修复：

1. **首页不应展示 Worker 状态** — HealthStatus 组件内容（Worker/Phase/联调状态）应移除或折叠
2. **首页不应展示 phase** — Phase 标签是开发信息，不应面向玩家
3. **首页不应有"检查 Worker 状态"按钮** — 这是 admin/dev 操作
4. **Hero 文案应面向玩家** — 当前文案偏技术栈介绍（Cloudflare-first/架构），应改为面向玩家的游戏体验描述
5. **Game Catalog 说明文字太技术** — 不应出现 `/api/games`、`packages/protocol` 等技术细节
6. **右上导航不应罗列所有 demo 游戏** — Token Demo 和 Sudoku 链接属于开发入口
7. **Session ID 应对玩家改名为"房间号"**
8. **公开 UI 里不要出现过多工程术语**

## Future UX Features

1. Game Catalog 筛选：单人/多人、人数、状态、分类标签
2. Token Bluffing / Sudoku Lite 隐藏到 demo/admin/dev 分类
3. 首页 Hero 使用游戏氛围视觉（木质桌面、token 图片）
4. "游戏"导航与"浏览游戏目录"按钮一致

## Do Not Do Yet

- 不要删除架构验证用的 demo 入口（未来隐藏但不删除）
- 不要移除 API client 中的任何函数
- 不要改变安全边界（hidden state/solution）

## Files You Can Modify

- `apps/web/src/pages/HomePage.tsx`
- `apps/web/src/components/AppLayout.tsx`
- `apps/web/src/components/HealthStatus.tsx`
- `apps/web/src/components/GameCatalog.tsx`
- `apps/web/src/components/GameCard.tsx`
- `apps/web/src/styles.css`

## Files You Must Not Change

- `apps/worker/` — 后端 API
- `packages/game-engine/` — 游戏引擎
- `packages/game-definitions/` — 游戏规则
- `packages/protocol/` — 共享协议（除非仅新增类型）
