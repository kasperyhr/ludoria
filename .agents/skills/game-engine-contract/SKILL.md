---
name: game-engine-contract
description: 当任务涉及 `packages/game-engine`、游戏定义、命令、事件、状态、视角或 puzzle contract 时触发。
---

# 游戏引擎契约

## 什么时候触发

当任务涉及 `packages/game-engine`、游戏定义、命令、事件、状态、视角或 puzzle contract 时触发。

## 开发规则

多人游戏遵循 `Command -> Validate -> Event -> State -> View`；单人游戏遵循 `Puzzle -> Progress -> Move -> Completion`。

## 禁止事项

不要把具体游戏规则写进 React 组件或 API route handler。

## Checklist

- 接口是否通用
- 类型是否共享
- 是否能测试
- 是否避免泄露隐藏状态

## 项目示例

示例：新增棋类游戏时，只在 `packages/game-definitions` 实现定义，并依赖 `packages/game-engine` 抽象。
