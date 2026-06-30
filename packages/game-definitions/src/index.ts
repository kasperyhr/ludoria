export {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from './multiplayer/token-bluffing-demo';
export type {
  TokenBluffingCommand,
  TokenBluffingEvent,
  TokenBluffingPlayerState,
  TokenBluffingPlayerView,
  TokenBluffingSpectatorView,
  TokenBluffingState,
  TokenColor
} from './multiplayer/token-bluffing-demo';

import { tokenBluffingDemoDefinition } from './multiplayer/token-bluffing-demo';

export const multiplayerDefinitions = [tokenBluffingDemoDefinition] as const;
export const soloPuzzleDefinitions = [] as const;
