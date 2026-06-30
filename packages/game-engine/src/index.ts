export type ValidationResult<T = void, E extends string = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };

export type Result<T, E extends string = string> = ValidationResult<T, E>;

export interface GameCommand<Type extends string = string, Payload = unknown> {
  type: Type;
  playerId: string;
  payload: Payload;
}

export interface GameEvent<Type extends string = string, Payload = unknown> {
  id: string;
  type: Type;
  payload: Payload;
  isPublic: boolean;
  createdAt: string;
}

export interface GameSessionState<PlayerState = unknown, Event extends GameEvent = GameEvent> {
  sessionId: string;
  gameId: string;
  players: Record<string, PlayerState>;
  publicEvents: Event[];
  createdAt: string;
  updatedAt: string;
}

export interface PlayerView {
  sessionId: string;
  gameId: string;
  viewer: 'player';
  playerId: string;
}

export interface SpectatorView {
  sessionId: string;
  gameId: string;
  viewer: 'spectator';
}

export interface MultiplayerGameDefinition<
  Command extends GameCommand = GameCommand,
  Event extends GameEvent = GameEvent,
  State extends GameSessionState = GameSessionState,
  PlayerViewShape extends PlayerView = PlayerView,
  SpectatorViewShape extends SpectatorView = SpectatorView
> {
  id: string;
  displayName: string;
  setup(sessionId: string): State;
  validateCommand(command: Command, state: State): ValidationResult<Event>;
  applyCommand(command: Command, state: State): ValidationResult<{ event: Event; state: State }>;
  applyEvent(state: State, event: Event): State;
  getPlayerView(state: State, playerId: string): PlayerViewShape;
  getSpectatorView(state: State): SpectatorViewShape;
  getReviewSummary?(state: State): unknown;
}

export interface SoloPuzzleDefinition<Puzzle = unknown, Progress = unknown, Move = unknown, Completion = unknown> {
  id: string;
  displayName: string;
  createInitialProgress(puzzle: Puzzle): Progress;
  applyMove(progress: Progress, move: Move): Result<Progress>;
  checkCompletion(puzzle: Puzzle, progress: Progress): Completion;
}
