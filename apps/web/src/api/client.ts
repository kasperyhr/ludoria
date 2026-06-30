import type { GameCatalogItem, HealthResponse } from '@ludoria/protocol';

const apiBaseUrl = import.meta.env.VITE_LUDORIA_WORKER_API_URL ?? '/worker-api';

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

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
