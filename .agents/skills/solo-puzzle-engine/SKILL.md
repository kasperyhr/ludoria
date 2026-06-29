---
name: solo-puzzle-engine
description: 当任务涉及 Sudoku、Nonogram、题目生成、唯一解验证、难度、autosave、hint 或 completion check 时触发。
---

# 单人益智引擎

## 什么时候触发

当任务涉及 Sudoku、Nonogram、题目生成、唯一解验证、难度、autosave、hint 或 completion check 时触发。

## 开发规则

puzzle 逻辑放在引擎或游戏定义层，progress 和 move 使用明确契约。

## 禁止事项

禁止把明文 solution 发给前端；禁止只靠前端判断完成。

## Checklist

- 生成是否可复现
- 唯一解是否验证
- 进度是否可保存
- 提示是否不泄露答案

## 项目示例

示例：Sudoku 可以保存 solution hash，用服务端验证 move 或完成状态。
