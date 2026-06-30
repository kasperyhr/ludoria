export type ClientToServerMessage =
  | { type: 'JOIN_SESSION'; inviteCode: string; displayName?: string }
  | { type: 'RECONNECT'; sessionToken: string }
  | { type: 'SUBMIT_COMMAND'; commandId: string; payload: unknown }
  | { type: 'CHAT_MESSAGE'; text: string }
  | { type: 'HEARTBEAT'; at: number };

export type ServerToClientMessage =
  | { type: 'SESSION_SNAPSHOT'; view: unknown }
  | { type: 'PLAYER_VIEW_UPDATE'; view: unknown }
  | { type: 'PUBLIC_EVENT'; event: unknown }
  | { type: 'ERROR'; code: ProtocolErrorCode; message: string }
  | { type: 'IDLE_CHECK'; deadlineAt: number };

export type ProtocolErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_MESSAGE'
  | 'SESSION_NOT_FOUND'
  | 'COMMAND_REJECTED'
  | 'RATE_LIMITED';

export type GameMode = 'multiplayer' | 'solo';

export type GameStatus = 'planned' | 'preview' | 'available';

export interface GameCatalogItem {
  id: string;
  name: string;
  mode: GameMode;
  status: GameStatus;
  description: string;
  playerCountLabel: string;
}

export interface HealthResponse {
  ok: true;
  service: 'ludoria-worker';
  phase: 'phase-1';
}

export interface ApiError {
  ok: false;
  code: ProtocolErrorCode;
  message: string;
}
