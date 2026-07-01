import { Hono } from 'hono';
import type { WorkerEnv } from '../env';
import { apiError, getOrigin } from '../http';

export const multiplayerSessionRoutes = new Hono<{ Bindings: WorkerEnv }>();

function getSessionStub(env: WorkerEnv, sessionId: string) {
  return env.GAME_SESSION_OBJECT.get(env.GAME_SESSION_OBJECT.idFromName(sessionId));
}

function objectUrl(pathname: string, c: { req: { url: string } }, params: Record<string, string> = {}) {
  const url = new URL(`https://game-session-object.local${pathname}`);
  url.searchParams.set('origin', getOrigin(c.req.url));

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

multiplayerSessionRoutes.post('/api/sessions', (c) => {
  const sessionId = `session-${crypto.randomUUID()}`;
  const stub = getSessionStub(c.env, sessionId);
  return stub.fetch(objectUrl('/create', c), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sessionId })
  });
});

multiplayerSessionRoutes.post('/api/sessions/:sessionId/join', (c) => {
  const sessionId = c.req.param('sessionId');
  const stub = getSessionStub(c.env, sessionId);
  return stub.fetch(new Request(objectUrl('/join', c, { sessionId }), c.req.raw));
});

multiplayerSessionRoutes.get('/api/sessions/:sessionId/connect', (c) => {
  const sessionId = c.req.param('sessionId');
  const sessionToken = new URL(c.req.url).searchParams.get('token');

  if (!sessionToken) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Session or token not found.'), 404);
  }

  const stub = getSessionStub(c.env, sessionId);
  const url = objectUrl('/connect', c, { sessionId, token: sessionToken });
  return stub.fetch(new Request(url, c.req.raw));
});
