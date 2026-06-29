# Solo Puzzle Contract

## Sudoku

Sudoku 需要题目生成、唯一解验证、难度评级、进度保存、提示和完成检查。

## Nonogram

Nonogram 需要题面线索、网格进度、错误检查策略和完成判断。

## puzzle generation

生成逻辑必须在 puzzle engine 或服务端侧完成，不能散落到 React 组件。

## progress autosave

前端提交 move，服务端或本地持久层保存 progress。

## hint

提示必须基于安全的 puzzle representation，不能泄露完整 solution。

## completion check

完成检查使用 progress 和 puzzle metadata，不依赖前端自报完成。

## unique solution verification

适用游戏必须验证唯一解，例如 Sudoku。

## solution hash

可以保存 solution hash 或不可逆校验信息，避免把明文 solution 发送到前端。
