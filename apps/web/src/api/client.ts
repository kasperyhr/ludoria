import type {
  CreateSessionResponse,
  GameCatalogItem,
  HealthResponse,
  JoinSessionRequest,
  JoinSessionResponse
} from '@ludoria/protocol';

const apiBaseUrl = import.meta.env.VITE_LUDORIA_WORKER_API_URL ?? '/worker-api';

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
    headers: {
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
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
