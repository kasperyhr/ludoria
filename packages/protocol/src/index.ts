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
  phase: 'phase-1' | 'phase-2';
}

export interface ApiError {
  ok: false;
  code: ProtocolErrorCode;
  message: string;
}

export type SessionRole = 'player' | 'spectator';

export interface CreateSessionResponse {
  sessionId: string;
  gameId: 'token-bluffing-demo';
  websocketUrl: string;
}

export interface JoinSessionRequest {
  displayName: string;
  role: SessionRole;
}

export interface JoinSessionResponse {
  sessionId: string;
  role: SessionRole;
  actorId: string;
  sessionToken: string;
  websocketUrl: string;
}

export type TokenColor = 'red' | 'blue' | 'gold';

export interface TokenBluffingPublicPlayer {
  id: string;
  displayName: string;
  tokenCount: number;
  connected: boolean;
}

export interface TokenBluffingPublicEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  isPublic: true;
  createdAt: string;
}

export interface TokenBluffingPlayerView {
  sessionId: string;
  gameId: 'token-bluffing-demo';
  viewer: 'player';
  playerId: string;
  self: TokenBluffingPublicPlayer & {
    hiddenTokens: TokenColor[];
  };
  players: TokenBluffingPublicPlayer[];
  publicEvents: TokenBluffingPublicEvent[];
}

export interface TokenBluffingSpectatorView {
  sessionId: string;
  gameId: 'token-bluffing-demo';
  viewer: 'spectator';
  players: TokenBluffingPublicPlayer[];
  publicEvents: TokenBluffingPublicEvent[];
}

export type TokenBluffingView = TokenBluffingPlayerView | TokenBluffingSpectatorView;

export interface DeclareTokenCountCommandPayload {
  token: TokenColor;
  count: number;
}

export type ClientToServerMessage =
  | { type: 'JOIN_SESSION'; displayName: string; role: SessionRole }
  | { type: 'RECONNECT'; sessionToken: string }
  | { type: 'SUBMIT_COMMAND'; commandId: string; command: { type: 'DECLARE_TOKEN_COUNT'; payload: DeclareTokenCountCommandPayload } }
  | { type: 'CHAT_MESSAGE'; text: string }
  | { type: 'HEARTBEAT'; at: number };

export type ServerToClientMessage =
  | { type: 'SESSION_SNAPSHOT'; view: TokenBluffingView; sessionId: string; role: SessionRole }
  | { type: 'PLAYER_VIEW_UPDATE'; view: TokenBluffingPlayerView }
  | { type: 'SPECTATOR_VIEW_UPDATE'; view: TokenBluffingSpectatorView }
  | { type: 'PUBLIC_EVENT'; event: TokenBluffingPublicEvent }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'ERROR'; code: ProtocolErrorCode | string; message: string };

export interface ChatMessage {
  id: string;
  actorId: string;
  displayName: string;
  text: string;
  createdAt: string;
}
