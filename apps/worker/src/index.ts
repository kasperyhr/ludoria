import { Hono } from 'hono';
import type { ApiError, GameCatalogItem, HealthResponse, ProtocolErrorCode } from '@ludoria/protocol';

const app = new Hono();

const localCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const gameCatalog: GameCatalogItem[] = [
  {
    id: 'token-bluffing-demo',
    name: 'Token Bluffing Demo',
    mode: 'multiplayer',
    status: 'planned',
    description: '一个用于验证服务器权威状态、隐藏信息和玩家视角的多人桌游占位 demo。',
    playerCountLabel: '3-6 players'
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

function apiError(code: ProtocolErrorCode, message: string): ApiError {
  return { ok: false, code, message };
}

app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(localCorsHeaders)) {
    c.header(key, value);
  }

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
});

app.get('/health', (c) => {
  const response: HealthResponse = {
    ok: true,
    service: 'ludoria-worker',
    phase: 'phase-1'
  };

  return c.json(response);
});

app.get('/api/games', (c) => c.json(gameCatalog));

app.notFound((c) => c.json(apiError('SESSION_NOT_FOUND', 'Route not found'), 404));

app.onError((error, c) => {
  console.error(JSON.stringify({ level: 'error', message: error.message }));
  return c.json(apiError('INVALID_MESSAGE', 'Unexpected worker error'), 500);
});

export default app;
