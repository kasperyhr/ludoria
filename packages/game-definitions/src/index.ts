export {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from './multiplayer/token-bluffing-demo';
export {
  sudokuLiteBuiltInPuzzle,
  sudokuLiteDefinition
} from './solo/sudoku-lite';
export type {
  TokenBluffingCommand,
  TokenBluffingEvent,
  TokenBluffingPlayerState,
  TokenBluffingPlayerView,
  TokenBluffingSpectatorView,
  TokenBluffingState,
  TokenColor
} from './multiplayer/token-bluffing-demo';
export type {
  SudokuLiteMove,
  SudokuLiteProgress,
  SudokuLitePuzzle
} from './solo/sudoku-lite';

import { tokenBluffingDemoDefinition } from './multiplayer/token-bluffing-demo';
import { sudokuLiteDefinition } from './solo/sudoku-lite';

export const multiplayerDefinitions = [tokenBluffingDemoDefinition] as const;
export const soloPuzzleDefinitions = [sudokuLiteDefinition] as const;
