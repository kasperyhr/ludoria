import { Hono } from 'hono';
import {
  parseApplyPuzzleMoveRequest
} from '@ludoria/protocol';
import type {
  ApplyPuzzleMoveResponse,
  CreatePuzzleSessionResponse,
  PuzzleCompletionResponse,
  PuzzleHintResponse,
  PuzzlePublicView
} from '@ludoria/protocol';
import {
  sudokuLiteBuiltInPuzzle,
  sudokuLiteDefinition
} from '@ludoria/game-definitions';
import type { SudokuLiteProgress } from '@ludoria/game-definitions';
import type { WorkerEnv } from '../env';
import { apiError } from '../http';

interface PuzzleSession {
  sessionId: string;
  progress: SudokuLiteProgress;
}

const puzzleSessions = new Map<string, PuzzleSession>();

function createPuzzlePublicView(session: PuzzleSession): PuzzlePublicView {
  return {
    sessionId: session.sessionId,
    puzzle: sudokuLiteDefinition.getPublicPuzzle(sudokuLiteBuiltInPuzzle),
    progress: session.progress
  };
}

export const soloPuzzleRoutes = new Hono<{ Bindings: WorkerEnv }>();

soloPuzzleRoutes.post('/api/puzzles/sudoku-lite/sessions', (c) => {
  const session: PuzzleSession = {
    sessionId: `puzzle-${crypto.randomUUID()}`,
    progress: sudokuLiteDefinition.createInitialProgress(sudokuLiteBuiltInPuzzle)
  };
  puzzleSessions.set(session.sessionId, session);

  const response: CreatePuzzleSessionResponse = createPuzzlePublicView(session);
  return c.json(response, 201);
});

soloPuzzleRoutes.get('/api/puzzles/:sessionId', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  return c.json(createPuzzlePublicView(session));
});

soloPuzzleRoutes.post('/api/puzzles/:sessionId/move', async (c) => {
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

soloPuzzleRoutes.post('/api/puzzles/:sessionId/hint', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  const response: PuzzleHintResponse = {
    hint: sudokuLiteDefinition.getHint(sudokuLiteBuiltInPuzzle, session.progress)
  };
  return c.json(response);
});

soloPuzzleRoutes.post('/api/puzzles/:sessionId/check', (c) => {
  const session = puzzleSessions.get(c.req.param('sessionId'));

  if (!session) {
    return c.json(apiError('SESSION_NOT_FOUND', 'Puzzle session not found.'), 404);
  }

  const response: PuzzleCompletionResponse = sudokuLiteDefinition.checkCompletion(sudokuLiteBuiltInPuzzle, session.progress);
  return c.json(response);
});
