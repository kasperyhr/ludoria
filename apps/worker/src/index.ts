import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ ok: true, service: 'ludoria-worker' }));

app.get('/api/games', (c) => c.json({
  games: [],
  note: 'Phase 0 placeholder. Game catalog will come from packages/game-definitions later.'
}));

export default app;
