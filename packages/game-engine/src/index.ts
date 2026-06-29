export type Result<T, E extends string = string> =
  | { ok: true; value: T }
  | { ok: false; error: E; message: string };

export interface MultiplayerGameDefinition<Command = unknown, Event = unknown, State = unknown, PlayerView = unknown, SpectatorView = unknown> {
  id: string;
  displayName: string;
  validateCommand(command: Command, state: State): Result<Command>;
  applyEvent(state: State, event: Event): State;
  getPlayerView(state: State, playerId: string): PlayerView;
  getSpectatorView(state: State): SpectatorView;
  getReviewSummary?(state: State): unknown;
}

export interface SoloPuzzleDefinition<Puzzle = unknown, Progress = unknown, Move = unknown, Completion = unknown> {
  id: string;
  displayName: string;
  createInitialProgress(puzzle: Puzzle): Progress;
  applyMove(progress: Progress, move: Move): Result<Progress>;
  checkCompletion(puzzle: Puzzle, progress: Progress): Completion;
}
