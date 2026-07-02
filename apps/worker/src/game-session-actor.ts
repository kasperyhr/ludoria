import {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from '@ludoria/game-definitions';
import type { TokenBluffingState } from '@ludoria/game-definitions';
import type {
  ChatMessage,
  ClientToServerMessage,
  RoomStatus,
  JoinSessionResponse,
  ServerToClientMessage,
  SessionRole
} from '@ludoria/protocol';
import type { GameSessionSnapshot, GameSessionSnapshotParticipant } from './session-snapshot';
import {
  createRoomLifecycle,
  isParticipantTokenActive,
  ROOM_IDLE_CHECK_MS,
  trimChatMessages
} from './session-snapshot';

interface SessionParticipant extends GameSessionSnapshotParticipant {}

interface SessionTokenCredential {
  sessionToken: string;
  sessionTokenHash: string;
  tokenExpiresAt: string;
}

interface GameSessionActorOptions {
  onChange?: (actor: GameSessionActor) => void;
}

interface GameSessionActorSnapshotOptions extends GameSessionActorOptions {
  snapshot: GameSessionSnapshot;
}

interface SessionParticipantInput {
  actorId: string;
  displayName: string;
  role: SessionRole;
  sessionTokenHash: string;
  tokenExpiresAt: string;
  revokedAt?: string;
}

interface Connection {
  actorId: string;
  role: SessionRole;
}

export interface ClientMessageResult {
  directMessages: ServerToClientMessage[];
  broadcastEvent?: ServerToClientMessage;
  shouldBroadcastViews?: boolean;
  isActivity?: boolean;
}

export class GameSessionActor {
  readonly sessionId: string;
  private state: TokenBluffingState;
  private readonly participants = new Map<string, SessionParticipant>();
  private readonly tokenHashToActorId = new Map<string, string>();
  private readonly chatMessages: ChatMessage[] = [];
  private readonly onChange?: (actor: GameSessionActor) => void;
  private roomStatus: RoomStatus = 'active';
  private expiresAt: string;
  private idleCheckAt: string;
  private lastActivityAt: string;
  private closedAt?: string;

  constructor(sessionId: string, options: GameSessionActorOptions = {}) {
    this.sessionId = sessionId;
    this.state = tokenBluffingDemoDefinition.setup(sessionId);
    this.onChange = options.onChange;
    const lifecycle = createRoomLifecycle(new Date(this.state.createdAt));
    this.roomStatus = lifecycle.roomStatus;
    this.expiresAt = lifecycle.expiresAt;
    this.idleCheckAt = lifecycle.idleCheckAt;
    this.lastActivityAt = lifecycle.lastActivityAt;
  }

  static fromSnapshot({ snapshot, onChange }: GameSessionActorSnapshotOptions) {
    const actor = new GameSessionActor(snapshot.sessionId, { onChange });
    actor.state = snapshot.state;

    for (const participant of snapshot.participants) {
      actor.addParticipant(participant);
    }

    actor.chatMessages.push(...trimChatMessages(snapshot.chatMessages));
    actor.roomStatus = snapshot.roomStatus ?? 'active';
    actor.expiresAt = snapshot.expiresAt ?? createRoomLifecycle(new Date(snapshot.createdAt)).expiresAt;
    actor.idleCheckAt = snapshot.idleCheckAt ?? createRoomLifecycle(new Date(snapshot.updatedAt)).idleCheckAt;
    actor.lastActivityAt = snapshot.lastActivityAt ?? snapshot.updatedAt;
    actor.closedAt = snapshot.closedAt;
    return actor;
  }

  join(displayName: string, role: SessionRole, credential: SessionTokenCredential): JoinSessionResponse {
    const actorId = `${role}-${crypto.randomUUID()}`;
    const participant: SessionParticipant = {
      actorId,
      displayName,
      role,
      sessionTokenHash: credential.sessionTokenHash,
      tokenExpiresAt: credential.tokenExpiresAt
    };

    this.addParticipant(participant);

    if (role === 'player') {
      const player = createTokenBluffingPlayer(Object.keys(this.state.players).length, actorId, displayName);
      const result = addTokenBluffingPlayer(this.state, player);
      this.state = result.state;
    }

    this.recordActivity();
    this.notifyChange();

    return {
      sessionId: this.sessionId,
      role,
      actorId,
      sessionToken: credential.sessionToken,
      websocketUrl: `/api/sessions/${this.sessionId}/connect?token=${encodeURIComponent(credential.sessionToken)}`
    };
  }

  toSnapshot(now = new Date()): GameSessionSnapshot {
    return {
      version: 1,
      sessionId: this.sessionId,
      gameId: 'token-bluffing-demo',
      state: this.state,
      participants: [...this.participants.values()],
      chatMessages: trimChatMessages(this.chatMessages),
      roomStatus: this.roomStatus,
      expiresAt: this.expiresAt,
      idleCheckAt: this.idleCheckAt,
      lastActivityAt: this.lastActivityAt,
      ...(this.closedAt ? { closedAt: this.closedAt } : {}),
      createdAt: this.state.createdAt,
      updatedAt: now.toISOString()
    };
  }

  revokeParticipantToken(actorId: string, revokedAt = new Date().toISOString()) {
    const participant = this.participants.get(actorId);

    if (!participant || participant.revokedAt) {
      return false;
    }

    participant.revokedAt = revokedAt;
    this.notifyChange();
    return true;
  }

  validateConnectionToken(sessionTokenHash: string, now = new Date()):
    | { ok: true; actorId: string; participant: SessionParticipant }
    | { ok: false; message: string } {
    const actorId = this.tokenHashToActorId.get(sessionTokenHash);

    if (!actorId) {
      return { ok: false, message: 'Invalid session token.' };
    }

    const participant = this.participants.get(actorId);

    if (!participant) {
      return { ok: false, message: 'Participant not found.' };
    }

    if (!isParticipantTokenActive(participant, now)) {
      return { ok: false, message: 'Session token expired or revoked.' };
    }

    return { ok: true, actorId, participant };
  }

  markConnected(actorId: string) {
    const participant = this.participants.get(actorId);

    if (!participant) {
      return { ok: false, message: 'Participant not found.' };
    }

    if (participant.role === 'player' && this.state.players[actorId]) {
      this.state = {
        ...this.state,
        players: {
          ...this.state.players,
          [actorId]: {
            ...this.state.players[actorId],
            connected: true
          }
        },
        updatedAt: new Date().toISOString()
      };
      this.notifyChange();
    }

    return { ok: true, participant };
  }

  markDisconnected(actorId: string) {
    const participant = this.participants.get(actorId);
    const player = this.state.players[actorId];

    if (!participant || participant.role !== 'player' || !player) {
      return false;
    }

    this.state = {
      ...this.state,
      players: {
        ...this.state.players,
        [actorId]: {
          ...player,
          connected: false
        }
      },
      updatedAt: new Date().toISOString()
    };
    this.notifyChange();
    return true;
  }

  setRoomStatus(status: RoomStatus, closedAt?: string) {
    this.roomStatus = status;
    this.closedAt = closedAt;
    this.notifyChange();
  }

  handleClientMessage(connection: Connection, message: ClientToServerMessage): ClientMessageResult {
    if (message.type === 'HEARTBEAT') {
      return {
        directMessages: [this.getSnapshotForParticipant(connection.actorId, connection.role)]
      };
    }

    if (message.type === 'KEEP_ALIVE') {
      this.recordActivity();
      return {
        directMessages: [this.getSnapshotForParticipant(connection.actorId, connection.role)],
        isActivity: true
      };
    }

    if (message.type === 'CHAT_MESSAGE') {
      return this.handleChatMessage(connection, message.text);
    }

    if (message.type === 'SUBMIT_COMMAND') {
      return this.handleSubmitCommand(connection, message);
    }

    if (message.type === 'RECONNECT') {
      return {
        directMessages: [this.getSnapshotForParticipant(connection.actorId, connection.role)]
      };
    }

    if (message.type === 'JOIN_SESSION') {
      return {
        directMessages: [this.getSnapshotForParticipant(connection.actorId, connection.role)]
      };
    }

    return { directMessages: [] };
  }

  private handleSubmitCommand(
    connection: Connection,
    message: Extract<ClientToServerMessage, { type: 'SUBMIT_COMMAND' }>
  ): ClientMessageResult {
    if (connection.role !== 'player') {
      return {
        directMessages: [{ type: 'ERROR', code: 'UNAUTHORIZED', message: 'Only players can submit commands.' }]
      };
    }

    const result = tokenBluffingDemoDefinition.applyCommand({
      type: message.command.type,
      playerId: connection.actorId,
      payload: message.command.payload
    }, this.state);

    if (!result.ok) {
      return {
        directMessages: [{ type: 'ERROR', code: result.error, message: result.message }]
      };
    }

    this.state = result.value.state;
    this.recordActivity();
    this.notifyChange();
    return {
      directMessages: [],
      broadcastEvent: { type: 'PUBLIC_EVENT', event: result.value.event },
      shouldBroadcastViews: true,
      isActivity: true
    };
  }

  private handleChatMessage(connection: Connection, text: string): ClientMessageResult {
    const participant = this.participants.get(connection.actorId);

    if (!participant || !text.trim()) {
      return { directMessages: [] };
    }

    const message: ChatMessage = {
      id: `chat-${crypto.randomUUID()}`,
      actorId: connection.actorId,
      displayName: participant.displayName,
      text: text.trim().slice(0, 240),
      createdAt: new Date().toISOString()
    };

    this.chatMessages.push(message);
    this.recordActivity();
    this.notifyChange();
    return {
      directMessages: [],
      broadcastEvent: { type: 'CHAT_MESSAGE', message },
      isActivity: true
    };
  }

  getSnapshotForParticipant(actorId: string, role: SessionRole): ServerToClientMessage {
    if (role === 'player') {
      return {
        type: 'SESSION_SNAPSHOT',
        sessionId: this.sessionId,
        role: 'player',
        view: tokenBluffingDemoDefinition.getPlayerView(this.state, actorId)
      };
    }

    return {
      type: 'SESSION_SNAPSHOT',
      sessionId: this.sessionId,
      role: 'spectator',
      view: tokenBluffingDemoDefinition.getSpectatorView(this.state)
    };
  }

  getViewUpdateForParticipant(actorId: string, role: SessionRole): ServerToClientMessage {
    if (role === 'player') {
      return {
        type: 'PLAYER_VIEW_UPDATE',
        view: tokenBluffingDemoDefinition.getPlayerView(this.state, actorId)
      };
    }

    return {
      type: 'SPECTATOR_VIEW_UPDATE',
      view: tokenBluffingDemoDefinition.getSpectatorView(this.state)
    };
  }

  private addParticipant(participant: SessionParticipantInput) {
    this.participants.set(participant.actorId, { ...participant });
    this.tokenHashToActorId.set(participant.sessionTokenHash, participant.actorId);
  }

  private notifyChange() {
    this.onChange?.(this);
  }

  private recordActivity(now = new Date()) {
    this.roomStatus = 'active';
    this.idleCheckAt = new Date(now.getTime() + ROOM_IDLE_CHECK_MS).toISOString();
    this.lastActivityAt = now.toISOString();
  }
}
