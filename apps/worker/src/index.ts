import { Hono } from 'hono';
import type {
  ApiError,
  CreateSessionResponse,
  HealthResponse,
  JoinSessionRequest,
  ProtocolErrorCode
} from '@ludoria/protocol';
import { gameCatalog } from './catalog';
import { createGameSessionActor, getGameSessionActor } from './game-session-actor';

const app = new Hono();

const localCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function apiError(code: ProtocolErrorCode, message: string): ApiError {
  return { ok: false, code, message };
}

function getOrigin(url: string) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
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
    phase: 'phase-2'
  };

  return c.json(response);
});

app.get('/api/games', (c) => c.json(gameCatalog));

app.post('/api/sessions', (c) => {
  const actor = createGameSessionActor();
  const response: CreateSessionResponse = {
    sessionId: actor.sessionId,
    gameId: 'token-bluffing-demo',
    websocketUrl: `${getOrigin(c.req.url)}/api/sessions/${actor.sessionId}/connect`
  };

  return c.json(response, 201);
});

app.post('/api/sessions/:sessionId/join', async (c) => {
  const actor = getGameSessionActor(c.req.param('sessionId'));

  if (!actor) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Session not found.'), 404);
  }

  const body = await c.req.json<JoinSessionRequest>().catch(() => null);

  if (!body || !body.displayName?.trim() || !['player', 'spectator'].includes(body.role)) {
    return c.json(apiError('INVALID_MESSAGE', 'displayName and role are required.'), 400);
  }

  const response = actor.join(body.displayName.trim().slice(0, 32), body.role);

  return c.json({
    ...response,
    websocketUrl: `${getOrigin(c.req.url)}${response.websocketUrl}`
  });
});

app.get('/api/sessions/:sessionId/connect', (c) => {
  const actor = getGameSessionActor(c.req.param('sessionId'));
  const sessionToken = new URL(c.req.url).searchParams.get('token');

  if (!actor || !sessionToken) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Session or token not found.'), 404);
  }

  const upgradeHeader = c.req.header('Upgrade');

  if (upgradeHeader !== 'websocket') {
    return c.json(apiError('INVALID_MESSAGE', 'Expected WebSocket upgrade.'), 426);
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
  server.accept();
  actor.connect(server, sessionToken);

  return new Response(null, {
    status: 101,
    webSocket: client
  });
});

app.notFound((c) => c.json(apiError('SESSION_NOT_FOUND', 'Route not found'), 404));

app.onError((error, c) => {
  console.error(JSON.stringify({ level: 'error', message: error.message }));
  return c.json(apiError('INVALID_MESSAGE', 'Unexpected worker error'), 500);
});

export default app;
