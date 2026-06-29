# Ludoria Codex Rules

1. 请全程用中文和用户交流，除非代码、命令、文件名、API 名称必须使用英文。
2. 这个项目不是普通 CRUD 网站，而是“多人桌游 + 单人益智游戏”的在线 Game Hub。
3. 多人游戏的核心是 `GameSessionActor`。
4. 多人游戏必须使用服务器权威状态。
5. 多人游戏逻辑必须遵循 `Command -> Validate -> Event -> State -> View`。
6. 单人 puzzle 逻辑必须遵循 `Puzzle -> Progress -> Move -> Completion`。
7. 不允许在 React 组件中实现核心游戏规则。
8. 不允许在 API route handler 中堆复杂游戏规则。
9. 所有多人游戏必须通过 `getPlayerView` / `getSpectatorView` 生成视角。
10. 不允许把完整隐藏 `GameState` 发给前端。
11. 单人 puzzle 不允许把明文 `solution` 发给前端。
12. 新增游戏必须放在 `packages/game-definitions`。
13. 通用游戏抽象必须放在 `packages/game-engine`。
14. 前后端共享协议必须放在 `packages/protocol`。
15. 数据库 schema 必须放在 `packages/db`。
16. UI 组件必须优先放在 `packages/ui`。
17. 每次修改后应尽量运行 `typecheck`、`lint`、`test`、`build`。
18. 不要擅自部署到 Cloudflare，除非用户明确要求。
19. 不要擅自修改 DNS。
20. 不要擅自创建付费资源。
21. 不要擅自引入重量级依赖。
22. 中文文档、README、AGENTS 和 repo-scoped skills 必须以 UTF-8 正确保存；如果出现连续问号、乱码或替换字符，必须先修复再继续开发。
