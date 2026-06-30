import type { GameCatalogItem } from '@ludoria/protocol';

export const gameCatalog: GameCatalogItem[] = [
  {
    id: 'token-bluffing-demo',
    name: 'Token Bluffing Demo',
    mode: 'multiplayer',
    status: 'preview',
    description: '最小多人隐藏信息 demo，用于验证服务器权威状态、WebSocket 和安全视角投影。',
    playerCountLabel: '2-6 players'
  },
  {
    id: 'sudoku',
    name: 'Sudoku',
    mode: 'solo',
    status: 'planned',
    description: '单人数字逻辑 puzzle，占位用于后续验证题目生成、进度保存和完成检查。',
    playerCountLabel: 'Solo'
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    mode: 'solo',
    status: 'planned',
    description: '单人数织 puzzle，占位用于后续验证线索、网格进度和 solution hash。',
    playerCountLabel: 'Solo'
  }
];
