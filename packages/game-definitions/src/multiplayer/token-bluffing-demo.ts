import type {
  GameCommand,
  GameEvent,
  GameSessionState,
  MultiplayerGameDefinition,
  PlayerView,
  SpectatorView,
  ValidationResult
} from '@ludoria/game-engine';

export type TokenColor = 'red' | 'blue' | 'gold';

export interface TokenBluffingPlayerState {
  id: string;
  displayName: string;
  hiddenTokens: TokenColor[];
  connected: boolean;
}

export interface TokenBluffingPublicPlayer {
  id: string;
  displayName: string;
  tokenCount: number;
  connected: boolean;
}

export type TokenBluffingCommand = GameCommand<
  'DECLARE_TOKEN_COUNT',
  {
    token: TokenColor;
    count: number;
  }
>;

export type TokenBluffingEvent = GameEvent<
  'PLAYER_JOINED' | 'TOKEN_COUNT_DECLARED',
  {
    playerId: string;
    displayName: string;
    declaredToken?: TokenColor;
    declaredCount?: number;
  }
> & { isPublic: true };

export interface TokenBluffingState extends GameSessionState<TokenBluffingPlayerState, TokenBluffingEvent> {
  gameId: 'token-bluffing-demo';
}

export interface TokenBluffingPlayerView extends PlayerView {
  gameId: 'token-bluffing-demo';
  viewer: 'player';
  self: TokenBluffingPublicPlayer & {
    hiddenTokens: TokenColor[];
  };
  players: TokenBluffingPublicPlayer[];
  publicEvents: TokenBluffingEvent[];
}

export interface TokenBluffingSpectatorView extends SpectatorView {
  gameId: 'token-bluffing-demo';
  viewer: 'spectator';
  players: TokenBluffingPublicPlayer[];
  publicEvents: TokenBluffingEvent[];
}

const tokenDeck: TokenColor[][] = [
  ['red', 'blue', 'gold'],
  ['red', 'red', 'blue'],
  ['blue', 'gold', 'gold'],
  ['red', 'blue', 'blue'],
  ['gold', 'red', 'gold'],
  ['blue', 'red', 'gold']
];

function nowIso() {
  return new Date().toISOString();
}

function createPublicEvent(
  sessionId: string,
  type: TokenBluffingEvent['type'],
  payload: TokenBluffingEvent['payload']
): TokenBluffingEvent {
  return {
    id: `${sessionId}-${type.toLowerCase()}-${crypto.randomUUID()}`,
    type,
    payload,
    isPublic: true,
    createdAt: nowIso()
  };
}

function toPublicPlayer(player: TokenBluffingPlayerState): TokenBluffingPublicPlayer {
  return {
    id: player.id,
    displayName: player.displayName,
    tokenCount: player.hiddenTokens.length,
    connected: player.connected
  };
}

export function createTokenBluffingPlayer(
  existingPlayerCount: number,
  id: string,
  displayName: string
): TokenBluffingPlayerState {
  const hiddenTokens = tokenDeck[existingPlayerCount % tokenDeck.length] ?? tokenDeck[0] ?? ['red', 'blue', 'gold'];

  return {
    id,
    displayName,
    hiddenTokens: [...hiddenTokens],
    connected: true
  };
}

export function addTokenBluffingPlayer(
  state: TokenBluffingState,
  player: TokenBluffingPlayerState
): { event: TokenBluffingEvent; state: TokenBluffingState } {
  const event = createPublicEvent(state.sessionId, 'PLAYER_JOINED', {
    playerId: player.id,
    displayName: player.displayName
  });

  return {
    event,
    state: {
      ...state,
      players: {
        ...state.players,
        [player.id]: player
      },
      publicEvents: [...state.publicEvents, event],
      updatedAt: event.createdAt
    }
  };
}

function validateDeclareTokenCount(
  command: TokenBluffingCommand,
  state: TokenBluffingState
): ValidationResult<TokenBluffingEvent> {
  const player = state.players[command.playerId];

  if (!player) {
    return { ok: false, error: 'UNKNOWN_PLAYER', message: 'Player is not part of this session.' };
  }

  if (!['red', 'blue', 'gold'].includes(command.payload.token)) {
    return { ok: false, error: 'INVALID_TOKEN', message: 'Token must be red, blue, or gold.' };
  }

  if (!Number.isInteger(command.payload.count) || command.payload.count < 0 || command.payload.count > 9) {
    return { ok: false, error: 'INVALID_COUNT', message: 'Declared count must be an integer from 0 to 9.' };
  }

  return {
    ok: true,
    value: createPublicEvent(state.sessionId, 'TOKEN_COUNT_DECLARED', {
      playerId: player.id,
      displayName: player.displayName,
      declaredToken: command.payload.token,
      declaredCount: command.payload.count
    })
  };
}

export const tokenBluffingDemoDefinition: MultiplayerGameDefinition<
  TokenBluffingCommand,
  TokenBluffingEvent,
  TokenBluffingState,
  TokenBluffingPlayerView,
  TokenBluffingSpectatorView
> = {
  id: 'token-bluffing-demo',
  displayName: 'Token Bluffing Demo',
  setup(sessionId) {
    const createdAt = nowIso();

    return {
      sessionId,
      gameId: 'token-bluffing-demo',
      players: {},
      publicEvents: [],
      createdAt,
      updatedAt: createdAt
    };
  },
  validateCommand(command, state) {
    if (command.type !== 'DECLARE_TOKEN_COUNT') {
      return { ok: false, error: 'UNSUPPORTED_COMMAND', message: 'Only DECLARE_TOKEN_COUNT is supported.' };
    }

    return validateDeclareTokenCount(command, state);
  },
  applyCommand(command, state) {
    const validation = this.validateCommand(command, state);

    if (!validation.ok) {
      return validation;
    }

    const event = validation.value;

    return {
      ok: true,
      value: {
        event,
        state: this.applyEvent(state, event)
      }
    };
  },
  applyEvent(state, event) {
    return {
      ...state,
      publicEvents: [...state.publicEvents, event],
      updatedAt: event.createdAt
    };
  },
  getPlayerView(state, playerId) {
    const self = state.players[playerId];

    if (!self) {
      throw new Error('Cannot create player view for unknown player.');
    }

    return {
      sessionId: state.sessionId,
      gameId: state.gameId,
      viewer: 'player',
      playerId,
      self: {
        ...toPublicPlayer(self),
        hiddenTokens: [...self.hiddenTokens]
      },
      players: Object.values(state.players).map(toPublicPlayer),
      publicEvents: state.publicEvents
    };
  },
  getSpectatorView(state) {
    return {
      sessionId: state.sessionId,
      gameId: state.gameId,
      viewer: 'spectator',
      players: Object.values(state.players).map(toPublicPlayer),
      publicEvents: state.publicEvents
    };
  },
  getReviewSummary(state) {
    return {
      sessionId: state.sessionId,
      gameId: state.gameId,
      publicEventCount: state.publicEvents.length,
      playerCount: Object.keys(state.players).length
    };
  }
};
