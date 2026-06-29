# Database Schema Draft

Phase 0 只记录表草案，后续使用 Drizzle ORM 为 D1 编写 schema 和 migrations。

## users

注册用户基础资料。

## guest_sessions

游客身份和过期时间。

## game_catalog

游戏目录、分类、状态和展示元数据。

## game_sessions

多人游戏房间或会话的元数据。

## session_players

玩家座位、连接状态和权限。

## session_invites

邀请码、过期时间和使用限制。

## puzzle_instances

单人 puzzle 实例和安全题面数据。

## puzzle_progress

用户或游客的 puzzle 进度。

## match_results

多人游戏结果。

## review_summaries

游戏结束后的复盘摘要。
