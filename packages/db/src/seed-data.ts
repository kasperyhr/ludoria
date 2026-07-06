import { gameCatalog } from './schema';
import type { InferInsertModel } from 'drizzle-orm';

export const seedGameCatalog: InferInsertModel<typeof gameCatalog>[] = [
  {
    id: 'token-bluffing-demo',
    name: 'Token Bluffing Demo',
    mode: 'multiplayer',
    status: 'preview',
    description: '最小多人隐藏信息 demo，用于验证服务器权威状态、WebSocket 和安全视角投影。',
    playerCountLabel: '2-6 players',
  },
  {
    id: 'sudoku-lite',
    name: 'Sudoku Lite',
    mode: 'solo',
    status: 'preview',
    description: '4x4 单人数独 demo，用于验证 Puzzle -> Progress -> Move -> Completion。',
    playerCountLabel: 'Solo',
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    mode: 'solo',
    status: 'planned',
    description: '单人数织 puzzle，占位用于后续验证线索、网格进度和 solution hash。',
    playerCountLabel: 'Solo',
  },
];
