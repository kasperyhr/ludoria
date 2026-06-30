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

interface SessionParticipant {
  actorId: string;
  displayName: string;
  role: SessionRole;
  sessionToken: string;
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
  private readonly tokenToActorId = new Map<string, string>();
  private readonly connections = new Map<WebSocket, Connection>();
  private readonly chatMessages: ChatMessage[] = [];

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.state = tokenBluffingDemoDefinition.setup(sessionId);
  }

  join(displayName: string, role: SessionRole): JoinSessionResponse {
    const actorId = `${role}-${crypto.randomUUID()}`;
    const sessionToken = crypto.randomUUID();
    const participant: SessionParticipant = {
      actorId,
      displayName,
      role,
      sessionToken
    };

    this.participants.set(actorId, participant);
    this.tokenToActorId.set(sessionToken, actorId);

    if (role === 'player') {
      const player = createTokenBluffingPlayer(Object.keys(this.state.players).length, actorId, displayName);
      const result = addTokenBluffingPlayer(this.state, player);
      this.state = result.state;
      this.broadcastPublicEvent(result.event);
      this.broadcastViews();
    }

    return {
      sessionId: this.sessionId,
      role,
      actorId,
      sessionToken,
      websocketUrl: `/api/sessions/${this.sessionId}/connect?token=${encodeURIComponent(sessionToken)}`
    };
  }

  connect(socket: WebSocket, sessionToken: string) {
    const actorId = this.tokenToActorId.get(sessionToken);

    if (!actorId) {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: 'Invalid session token.' });
      socket.close(1008, 'Invalid session token');
      return;
    }

    const participant = this.participants.get(actorId);

    if (!participant) {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: 'Participant not found.' });
      socket.close(1008, 'Participant not found');
      return;
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
      const parsed = JSON.parse(raw) as ClientToServerMessage;

      if (!parsed || typeof parsed !== 'object' || typeof parsed.type !== 'string') {
        return null;
      }

      // TODO: Replace this minimal validation with Zod or Valibot schemas when protocol hardens.
      return parsed;
    } catch {
      return null;
    }
  }
}

const sessions = new Map<string, GameSessionActor>();

export function createGameSessionActor() {
  const sessionId = `session-${crypto.randomUUID()}`;
  const actor = new GameSessionActor(sessionId);
  sessions.set(sessionId, actor);
  return actor;
}

export function getGameSessionActor(sessionId: string) {
  return sessions.get(sessionId);
}
