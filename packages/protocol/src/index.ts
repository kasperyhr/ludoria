import * as v from 'valibot';

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
  phase: 'phase-1' | 'phase-2' | 'phase-3' | 'phase-4a' | 'phase-4b' | 'phase-4c';
}

export interface ApiError {
  ok: false;
  code: ProtocolErrorCode;
  message: string;
}

export type SchemaParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'INVALID_MESSAGE'; message: string };

function parseWithSchema<T>(schema: v.GenericSchema<unknown, T>, input: unknown): SchemaParseResult<T> {
  const result = v.safeParse(schema, input);

  if (result.success) {
    return { ok: true, value: result.output };
  }

  return {
    ok: false,
    code: 'INVALID_MESSAGE',
    message: result.issues.map((issue) => issue.message).join('; ') || 'Invalid payload.'
  };
}

export type SessionRole = 'player' | 'spectator';

export type RoomStatus = 'active' | 'idle_checking' | 'closed' | 'abandoned';

export interface CreateSessionResponse {
  sessionId: string;
  gameId: 'token-bluffing-demo';
  websocketUrl: string;
}

export const JoinSessionRequestSchema = v.object({
  displayName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32)),
  role: v.picklist(['player', 'spectator'])
});

export type JoinSessionRequest = v.InferOutput<typeof JoinSessionRequestSchema>;

export function parseJoinSessionRequest(input: unknown): SchemaParseResult<JoinSessionRequest> {
  return parseWithSchema(JoinSessionRequestSchema, input);
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

export const DeclareTokenCountCommandSchema = v.object({
  type: v.literal('DECLARE_TOKEN_COUNT'),
  payload: v.object({
    token: v.picklist(['red', 'blue', 'gold']),
    count: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(9))
  })
});

export const ClientToServerMessageSchema = v.variant('type', [
  v.object({
    type: v.literal('JOIN_SESSION'),
    displayName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(32)),
    role: v.picklist(['player', 'spectator'])
  }),
  v.object({
    type: v.literal('RECONNECT')
  }),
  v.object({
    type: v.literal('KEEP_ALIVE')
  }),
  v.object({
    type: v.literal('SUBMIT_COMMAND'),
    commandId: v.pipe(v.string(), v.minLength(1)),
    command: DeclareTokenCountCommandSchema
  }),
  v.object({
    type: v.literal('CHAT_MESSAGE'),
    text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(240))
  }),
  v.object({
    type: v.literal('HEARTBEAT'),
    at: v.number()
  })
]);

export type ClientToServerMessage = v.InferOutput<typeof ClientToServerMessageSchema>;

export function parseClientToServerMessage(input: unknown): SchemaParseResult<ClientToServerMessage> {
  return parseWithSchema(ClientToServerMessageSchema, input);
}

export type ServerToClientMessage =
  | { type: 'SESSION_SNAPSHOT'; view: TokenBluffingView; sessionId: string; role: SessionRole }
  | { type: 'PLAYER_VIEW_UPDATE'; view: TokenBluffingPlayerView }
  | { type: 'SPECTATOR_VIEW_UPDATE'; view: TokenBluffingSpectatorView }
  | { type: 'PUBLIC_EVENT'; event: TokenBluffingPublicEvent }
  | { type: 'CHAT_MESSAGE'; message: ChatMessage }
  | { type: 'IDLE_CHECK'; sessionId: string; message: string; expiresAt: string }
  | { type: 'ROOM_STATUS_CHANGED'; sessionId: string; status: RoomStatus }
  | { type: 'ERROR'; code: ProtocolErrorCode | string; message: string };

export interface ChatMessage {
  id: string;
  actorId: string;
  displayName: string;
  text: string;
  createdAt: string;
}

export type SudokuCellValue = 1 | 2 | 3 | 4;

export interface SudokuLitePublicPuzzle {
  id: 'sudoku-lite-built-in-001';
  gameId: 'sudoku-lite';
  size: 4;
  boxSize: 2;
  difficulty: 'intro';
  givens: Array<{
    row: number;
    col: number;
    value: SudokuCellValue;
  }>;
  solutionHash: string;
}

export interface PuzzleProgressView {
  cells: Array<Array<SudokuCellValue | null>>;
  updatedAt: string;
  moveCount: number;
}

export interface PuzzlePublicView {
  sessionId: string;
  puzzle: SudokuLitePublicPuzzle;
  progress: PuzzleProgressView;
}

export interface CreatePuzzleSessionResponse extends PuzzlePublicView {}

export const ApplyPuzzleMoveRequestSchema = v.object({
  row: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3)),
  col: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3)),
  value: v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(4)))
});

export interface ApplyPuzzleMoveRequest {
  row: number;
  col: number;
  value: SudokuCellValue | null;
}

export function parseApplyPuzzleMoveRequest(input: unknown): SchemaParseResult<ApplyPuzzleMoveRequest> {
  return parseWithSchema(ApplyPuzzleMoveRequestSchema, input) as SchemaParseResult<ApplyPuzzleMoveRequest>;
}

export interface ApplyPuzzleMoveResponse {
  progress: PuzzleProgressView;
}

export interface PuzzleHintResponse {
  hint: {
    row: number;
    col: number;
    candidates: SudokuCellValue[];
    message: string;
  } | null;
}

export interface PuzzleCompletionResponse {
  isComplete: boolean;
  isSolved: boolean;
  emptyCells: number;
  errorCount: number;
}
