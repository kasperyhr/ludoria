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

export interface Puzzle {
  id: string;
  gameId: string;
}

export interface Progress {
  updatedAt: string;
}

export interface Move {
  row: number;
  col: number;
  value: unknown;
}

export interface Hint {
  row: number;
  col: number;
  message: string;
}

export interface CompletionResult {
  isComplete: boolean;
  isSolved: boolean;
}

export interface SoloPuzzleDefinition<
  PuzzleShape extends Puzzle = Puzzle,
  PublicPuzzle = unknown,
  ProgressShape extends Progress = Progress,
  MoveShape extends Move = Move,
  HintShape extends Hint = Hint,
  CompletionShape extends CompletionResult = CompletionResult
> {
  id: string;
  displayName: string;
  createInitialProgress(puzzle: PuzzleShape): ProgressShape;
  validateMove(puzzle: PuzzleShape, progress: ProgressShape, move: MoveShape): Result<MoveShape>;
  applyMove(puzzle: PuzzleShape, progress: ProgressShape, move: MoveShape): Result<ProgressShape>;
  checkCompletion(puzzle: PuzzleShape, progress: ProgressShape): CompletionShape;
  getHint(puzzle: PuzzleShape, progress: ProgressShape): HintShape | null;
  getPublicPuzzle(puzzle: PuzzleShape): PublicPuzzle;
  getSolutionHash(puzzle: PuzzleShape): string;
}
