import { Hono } from 'hono';
import type { WorkerEnv } from './env';
import { apiError, localCorsHeaders } from './http';
import { GameSessionObject } from './durable-objects/GameSessionObject';
import { gamesRoutes } from './routes/games';
import { healthRoutes } from './routes/health';
import { multiplayerSessionRoutes } from './routes/multiplayer-sessions';
import { soloPuzzleRoutes } from './routes/solo-puzzles';

const app = new Hono<{ Bindings: WorkerEnv }>();

app.use('*', async (c, next) => {
  for (const [key, value] of Object.entries(localCorsHeaders)) {
    c.header(key, value);
  }

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204);
  }

  await next();
});

app.route('/', healthRoutes);
app.route('/', gamesRoutes);
app.route('/', multiplayerSessionRoutes);
app.route('/', soloPuzzleRoutes);

app.notFound((c) => c.json(apiError('SESSION_NOT_FOUND', 'Route not found'), 404));

app.onError((error, c) => {
  console.error(JSON.stringify({ level: 'error', message: error.message }));
  return c.json(apiError('INVALID_MESSAGE', 'Unexpected worker error'), 500);
});

export { GameSessionObject };

export default app;
