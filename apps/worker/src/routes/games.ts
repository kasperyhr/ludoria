import { Hono } from 'hono';
import type { WorkerEnv } from '../env';
import { gameCatalog } from '../catalog';

export const gamesRoutes = new Hono<{ Bindings: WorkerEnv }>();

gamesRoutes.get('/api/games', (c) => c.json(gameCatalog));
