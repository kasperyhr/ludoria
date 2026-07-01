import { Hono } from 'hono';
import type { HealthResponse } from '@ludoria/protocol';
import type { WorkerEnv } from '../env';

export const healthRoutes = new Hono<{ Bindings: WorkerEnv }>();

healthRoutes.get('/health', (c) => {
  const response: HealthResponse = {
    ok: true,
    service: 'ludoria-worker',
    phase: 'phase-4a'
  };

  return c.json(response);
});
