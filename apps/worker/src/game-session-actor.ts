import {
  addTokenBluffingPlayer,
  createTokenBluffingPlayer,
  tokenBluffingDemoDefinition
} from '@ludoria/game-definitions';
import type { TokenBluffingEvent, TokenBluffingState } from '@ludoria/game-definitions';
import type {
  ChatMessage,
  ClientToServerMessage,
  JoinSessionResponse,
  ServerToClientMessage,
  SessionRole
} from '@ludoria/protocol';
import { parseClientToServerMessage } from '@ludoria/protocol';
import type { GameSessionSnapshot, GameSessionSnapshotParticipant } from './session-snapshot';
import { isParticipantTokenActive, trimChatMessages } from './session-snapshot';

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
  socket: WebSocket;
}

export class GameSessionActor {
  readonly sessionId: string;
  private state: TokenBluffingState;
  private readonly participants = new Map<string, SessionParticipant>();
  private readonly tokenHashToActorId = new Map<string, string>();
  private readonly connections = new Map<WebSocket, Connection>();
  private readonly chatMessages: ChatMessage[] = [];
  private readonly onChange?: (actor: GameSessionActor) => void;

  constructor(sessionId: string, options: GameSessionActorOptions = {}) {
    this.sessionId = sessionId;
    this.state = tokenBluffingDemoDefinition.setup(sessionId);
    this.onChange = options.onChange;
  }

  static fromSnapshot({ snapshot, onChange }: GameSessionActorSnapshotOptions) {
    const actor = new GameSessionActor(snapshot.sessionId, { onChange });
    actor.state = snapshot.state;

    for (const participant of snapshot.participants) {
      actor.addParticipant(participant);
    }

    actor.chatMessages.push(...trimChatMessages(snapshot.chatMessages));
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
      this.broadcastPublicEvent(result.event);
      this.broadcastViews();
    }

    this.notifyChange();

    return {
      sessionId: this.sessionId,
      role,
      actorId,
      sessionToken: credential.sessionToken,
      websocketUrl: `/api/sessions/${this.sessionId}/connect?token=${encodeURIComponent(credential.sessionToken)}`
    };
  }

  connect(socket: WebSocket, sessionTokenHash: string) {
    const tokenValidation = this.validateConnectionToken(sessionTokenHash);

    if (!tokenValidation.ok) {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: tokenValidation.message });
      socket.close(1008, tokenValidation.message);
      return;
    }

    const { actorId, participant } = tokenValidation;

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

    this.connections.set(socket, {
      actorId,
      role: participant.role,
      socket
    });

    socket.addEventListener('message', (event) => this.handleMessage(socket, event.data));
    socket.addEventListener('close', () => this.disconnect(socket));
    socket.addEventListener('error', () => this.disconnect(socket));

    this.sendSnapshot(socket);
  }

  toSnapshot(now = new Date()): GameSessionSnapshot {
    return {
      version: 1,
      sessionId: this.sessionId,
      gameId: 'token-bluffing-demo',
      state: this.state,
      participants: [...this.participants.values()],
      chatMessages: trimChatMessages(this.chatMessages),
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

  private handleMessage(socket: WebSocket, raw: unknown) {
    const connection = this.connections.get(socket);

    if (!connection) {
      return;
    }

    const message = this.parseMessage(raw);

    if (!message) {
      this.send(socket, { type: 'ERROR', code: 'INVALID_MESSAGE', message: 'Invalid WebSocket message.' });
      return;
    }

    if (message.type === 'HEARTBEAT') {
      this.sendSnapshot(socket);
      return;
    }

    if (message.type === 'CHAT_MESSAGE') {
      this.handleChatMessage(connection, message.text);
      return;
    }

    if (message.type === 'SUBMIT_COMMAND') {
      this.handleSubmitCommand(socket, connection, message);
      return;
    }

    if (message.type === 'RECONNECT') {
      this.sendSnapshot(socket);
      return;
    }

    if (message.type === 'JOIN_SESSION') {
      this.sendSnapshot(socket);
    }
  }

  private handleSubmitCommand(
    socket: WebSocket,
    connection: Connection,
    message: Extract<ClientToServerMessage, { type: 'SUBMIT_COMMAND' }>
  ) {
    if (connection.role !== 'player') {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: 'Only players can submit commands.' });
      return;
    }

    const result = tokenBluffingDemoDefinition.applyCommand({
      type: message.command.type,
      playerId: connection.actorId,
      payload: message.command.payload
    }, this.state);

    if (!result.ok) {
      this.send(socket, { type: 'ERROR', code: result.error, message: result.message });
      return;
    }

    this.state = result.value.state;
    this.broadcastPublicEvent(result.value.event);
    this.broadcastViews();
    this.notifyChange();
  }

  private handleChatMessage(connection: Connection, text: string) {
    const participant = this.participants.get(connection.actorId);

    if (!participant || !text.trim()) {
      return;
    }

    const message: ChatMessage = {
      id: `chat-${crypto.randomUUID()}`,
      actorId: connection.actorId,
      displayName: participant.displayName,
      text: text.trim().slice(0, 240),
      createdAt: new Date().toISOString()
    };

    this.chatMessages.push(message);
    this.broadcast({ type: 'CHAT_MESSAGE', message });
    this.notifyChange();
  }

  private disconnect(socket: WebSocket) {
    const connection = this.connections.get(socket);
    this.connections.delete(socket);

    const player = connection ? this.state.players[connection.actorId] : undefined;

    if (!connection || connection.role !== 'player' || !player) {
      return;
    }

    this.state = {
      ...this.state,
      players: {
        ...this.state.players,
        [connection.actorId]: {
          ...player,
          connected: false
        }
      },
      updatedAt: new Date().toISOString()
    };

    this.broadcastViews();
    this.notifyChange();
  }

  private sendSnapshot(socket: WebSocket) {
    const connection = this.connections.get(socket);

    if (!connection) {
      return;
    }

    if (connection.role === 'player') {
      this.send(socket, {
        type: 'SESSION_SNAPSHOT',
        sessionId: this.sessionId,
        role: 'player',
        view: tokenBluffingDemoDefinition.getPlayerView(this.state, connection.actorId)
      });
      return;
    }

    this.send(socket, {
      type: 'SESSION_SNAPSHOT',
      sessionId: this.sessionId,
      role: 'spectator',
      view: tokenBluffingDemoDefinition.getSpectatorView(this.state)
    });
  }

  private broadcastViews() {
    for (const connection of this.connections.values()) {
      if (connection.role === 'player') {
        this.send(connection.socket, {
          type: 'PLAYER_VIEW_UPDATE',
          view: tokenBluffingDemoDefinition.getPlayerView(this.state, connection.actorId)
        });
      } else {
        this.send(connection.socket, {
          type: 'SPECTATOR_VIEW_UPDATE',
          view: tokenBluffingDemoDefinition.getSpectatorView(this.state)
        });
      }
    }
  }

  private broadcastPublicEvent(event: TokenBluffingEvent) {
    this.broadcast({ type: 'PUBLIC_EVENT', event });
  }

  private broadcast(message: ServerToClientMessage) {
    for (const connection of this.connections.values()) {
      this.send(connection.socket, message);
    }
  }

  private send(socket: WebSocket, message: ServerToClientMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private parseMessage(raw: unknown): ClientToServerMessage | null {
    if (typeof raw !== 'string') {
      return null;
    }

    try {
      const result = parseClientToServerMessage(JSON.parse(raw));
      return result.ok ? result.value : null;
    } catch {
      return null;
    }
  }

  private addParticipant(participant: SessionParticipantInput) {
    this.participants.set(participant.actorId, { ...participant });
    this.tokenHashToActorId.set(participant.sessionTokenHash, participant.actorId);
  }

  private notifyChange() {
    this.onChange?.(this);
  }
}
