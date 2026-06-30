import { Hono } from 'hono';
import {
  parseApplyPuzzleMoveRequest,
  parseJoinSessionRequest
} from '@ludoria/protocol';
import type {
  ApiError,
  ApplyPuzzleMoveResponse,
  CreatePuzzleSessionResponse,
  CreateSessionResponse,
  HealthResponse,
  ProtocolErrorCode,
  PuzzleCompletionResponse,
  PuzzleHintResponse,
  PuzzlePublicView
} from '@ludoria/protocol';
import {
  sudokuLiteBuiltInPuzzle,
  sudokuLiteDefinition
} from '@ludoria/game-definitions';
import type { SudokuLiteProgress } from '@ludoria/game-definitions';
import { gameCatalog } from './catalog';
import { createGameSessionActor, getGameSessionActor } from './game-session-actor';

interface PuzzleSession {
  sessionId: string;
  progress: SudokuLiteProgress;
}

const app = new Hono();
const puzzleSessions = new Map<string, PuzzleSession>();

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

function createPuzzlePublicView(session: PuzzleSession): PuzzlePublicView {
  return {
    sessionId: session.sessionId,
    puzzle: sudokuLiteDefinition.getPublicPuzzle(sudokuLiteBuiltInPuzzle),
    progress: session.progress
  };
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
    phase: 'phase-3'
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

  const input = await c.req.json().catch(() => null);
  const parsed = parseJoinSessionRequest(input);

  if (!parsed.ok) {
    return c.json(apiError('INVALID_MESSAGE', parsed.message), 400);
  }

  const response = actor.join(parsed.value.displayName, parsed.value.role);

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

app.post('/api/puzzles/sudoku-lite/sessions', (c) => {
  const session: PuzzleSession = {
    sessionId: `puzzle-${crypto.randomUUID()}`,
    progress: sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle)
  };
  puzzleSessions.set(session.sessionId, session);

  const response: CreatePuzzleSessionResponse = createPuzzlePublicView(session);
  return c.json(response, 201);
});

app.get('/api/puzzles/:sessionId', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  return c.json(createPuzzlePublicView(session));
});

app.post('/api/puzzles/:sessionId/move', async (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  const input = await c.req.json().catch(() => null);
  const parsed = parseApplyPuzzleMoveRequest(input);

  if (!parsed.ok) {
    return c.json(apiError('INVALID_MESSAGE', parsed.message), 400);
  }

  const result = sudokuLiteDefinition.applyMove(sudokuLiteBuiltInPuzzle, session.progress, parsed.value);

  if (!result.ok) {
    return c.json(apiError('COMMAND_REJECTED', result.message), 400);
  }

  session.progress = result.value;

  const response: ApplyPuzzleMoveResponse = {
    progress: session.progress
  };
  return c.json(response);
});

app.post('/api/puzzles/:sessionId/hint', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  const response: PuzzleHintResponse = {
    hint: sudokuLiteDefinition.getHint(sudokuLiteBuiltInPuzzle, session.progress)
  };
  return c.json(response);
});

app.post('/api/puzzles/:sessionId/check', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  const response: PuzzleCompletionResponse = sudokuLiteDefinition.checkCompletion(sudokuLiteBuiltInPuzzle, session.progress);
  return c.json(response);
});

app.notFound((c) => c.json(apiError('SESSION_NOT_FOUND', 'Route not found'), 404));

app.onError((error, c) => {
  console.error(JSON.stringify({ level: 'error', message: error.message }));
  return c.json(apiError('INVALID_MESSAGE', 'Unexpected worker error'), 500);
});

export default app;
