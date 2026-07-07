import type {
  ApplyPuzzleMoveRequest,
  ApplyPuzzleMoveResponse,
  CreatePuzzleSessionResponse,
  CreateSessionResponse,
  GameCatalogItem,
  HealthResponse,
  JoinSessionRequest,
  JoinSessionResponse,
  PuzzleCompletionResponse,
  PuzzleHintResponse,
  PuzzlePublicView
} from '@ludoria/protocol';

// MVP Worker deployment: same-origin (empty base).
// Local dev: set VITE_LUDORIA_API_ORIGIN=/worker-api via .env (Vite proxy).
// Future Pages: set VITE_LUDORIA_API_ORIGIN=https://worker-url.
const apiBaseUrl = import.meta.env.VITE_LUDORIA_API_ORIGIN ?? '';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Ludoria API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Ludoria API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/health');
}

export function getGameCatalog(): Promise<GameCatalogItem[]> {
  return requestJson<GameCatalogItem[]>('/api/games');
}

export function createSession(): Promise<CreateSessionResponse> {
  return postJson<CreateSessionResponse>('/api/sessions');
}

export function joinSession(sessionId: string, body: JoinSessionRequest): Promise<JoinSessionResponse> {
  return postJson<JoinSessionResponse>(`/api/sessions/${sessionId}/join`, body);
}

export function createSudokuLiteSession(): Promise<CreatePuzzleSessionResponse> {
  return postJson<CreatePuzzleSessionResponse>('/api/puzzles/sudoku-lite/sessions');
}

export function getPuzzleSession(sessionId: string): Promise<PuzzlePublicView> {
  return requestJson<PuzzlePublicView>(`/api/puzzles/${sessionId}`);
}

export function applyPuzzleMove(sessionId: string, body: ApplyPuzzleMoveRequest): Promise<ApplyPuzzleMoveResponse> {
  return postJson<ApplyPuzzleMoveResponse>(`/api/puzzles/${sessionId}/move`, body);
}

export function getPuzzleHint(sessionId: string): Promise<PuzzleHintResponse> {
  return postJson<PuzzleHintResponse>(`/api/puzzles/${sessionId}/hint`);
}

export function checkPuzzleCompletion(sessionId: string): Promise<PuzzleCompletionResponse> {
  return postJson<PuzzleCompletionResponse>(`/api/puzzles/${sessionId}/check`);
}
