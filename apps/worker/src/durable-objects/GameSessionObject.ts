import type { ClientToServerMessage, CreateSessionResponse, ServerToClientMessage } from '@ludoria/protocol';
import { parseClientToServerMessage, parseJoinSessionRequest } from '@ludoria/protocol';
import type { WorkerEnv } from '../env';
import { apiError, getOrigin } from '../http';
import { GameSessionActor } from '../game-session-actor';
import type { GameSessionSocketAttachment, GameSessionSnapshot } from '../session-snapshot';
import {
  advanceRoomLifecycle,
  createTokenExpiry,
  getNextLifecycleAlarm,
  hashSessionToken,
  isValidSocketAttachment,
  SESSION_SNAPSHOT_KEY
} from '../session-snapshot';

interface CreateSessionRequest {
  sessionId: string;
}

export class GameSessionObject {
  private actor: GameSessionActor | null = null;

  constructor(
    private readonly state: DurableObjectState,
    private readonly env: WorkerEnv
  ) {
    void this.state;
    void this.env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/create') {
      return this.createSession(request);
    }

    if (request.method === 'POST' && url.pathname === '/join') {
      return this.joinSession(request);
    }

    if (request.method === 'GET' && url.pathname === '/connect') {
      return this.connect(request);
    }

    return Response.json(apiError('SESSION_NOT_FOUND', 'Durable Object route not found.'), { status: 404 });
  }

  private async createSession(request: Request) {
    const body = await request.json<CreateSessionRequest>().catch(() => null);

    if (!body?.sessionId) {
      return Response.json(apiError('INVALID_MESSAGE', 'sessionId is required.'), { status: 400 });
    }

    const actor = new GameSessionActor(body.sessionId, {
      onChange: (changedActor) => {
        void this.saveSnapshot(changedActor);
      }
    });
    this.actor = actor;
    await this.saveSnapshot(actor);
    await this.scheduleLifecycleAlarm(actor.toSnapshot());

    const response: CreateSessionResponse = {
      sessionId: body.sessionId,
      gameId: 'token-bluffing-demo',
      websocketUrl: `${this.getPublicOrigin(request)}/api/sessions/${body.sessionId}/connect`
    };

    return Response.json(response, { status: 201 });
  }

  private async joinSession(request: Request) {
    const sessionId = this.getSessionId(request);
    const actor = sessionId ? await this.loadActor(sessionId) : null;

    if (!sessionId || !actor) {
      return Response.json(apiError('SESSION_NOT_FOUND', 'Session not found.'), { status: 404 });
    }

    const input = await request.json().catch(() => null);
    const parsed = parseJoinSessionRequest(input);

    if (!parsed.ok) {
      return Response.json(apiError('INVALID_MESSAGE', parsed.message), { status: 400 });
    }

    const sessionToken = crypto.randomUUID();
    const response = actor.join(parsed.value.displayName, parsed.value.role, {
      sessionToken,
      sessionTokenHash: await hashSessionToken(sessionToken),
      tokenExpiresAt: createTokenExpiry()
    });
    await this.saveSnapshot(actor);
    await this.scheduleLifecycleAlarm(actor.toSnapshot());

    return Response.json({
      ...response,
      websocketUrl: `${this.getPublicOrigin(request)}${response.websocketUrl}`
    });
  }

  private async connect(request: Request) {
    const sessionId = this.getSessionId(request);
    const actor = sessionId ? await this.loadActor(sessionId) : null;
    const sessionToken = new URL(request.url).searchParams.get('token');

    if (!actor || !sessionToken) {
      return Response.json(apiError('SESSION_NOT_FOUND', 'Session or token not found.'), { status: 404 });
    }

    const sessionTokenHash = await hashSessionToken(sessionToken);
    const tokenValidation = actor.validateConnectionToken(sessionTokenHash);

    if (!tokenValidation.ok) {
      return Response.json(apiError('UNAUTHORIZED', tokenValidation.message), { status: 401 });
    }

    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return Response.json(apiError('INVALID_MESSAGE', 'Expected WebSocket upgrade.'), { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    this.state.acceptWebSocket(server);

    const attachment: GameSessionSocketAttachment = {
      sessionId: actor.sessionId,
      actorId: tokenValidation.actorId,
      role: tokenValidation.participant.role,
      sessionTokenHash
    };
    server.serializeAttachment(attachment);

    actor.markConnected(tokenValidation.actorId);
    await this.saveSnapshot(actor);
    this.send(server, actor.getSnapshotForParticipant(tokenValidation.actorId, tokenValidation.participant.role));
    this.broadcastViews(actor);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(socket: WebSocket, rawMessage: string | ArrayBuffer) {
    const attachment = socket.deserializeAttachment();

    if (!isValidSocketAttachment(attachment)) {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: 'Invalid WebSocket attachment.' });
      socket.close(1008, 'Invalid WebSocket attachment.');
      return;
    }

    const actor = await this.loadActor(attachment.sessionId);

    if (!actor) {
      this.send(socket, { type: 'ERROR', code: 'SESSION_NOT_FOUND', message: 'Session not found.' });
      socket.close(1008, 'Session not found.');
      return;
    }

    const tokenValidation = actor.validateConnectionToken(attachment.sessionTokenHash);

    if (!tokenValidation.ok || tokenValidation.actorId !== attachment.actorId) {
      this.send(socket, { type: 'ERROR', code: 'UNAUTHORIZED', message: tokenValidation.ok ? 'Session token mismatch.' : tokenValidation.message });
      socket.close(1008, 'Session token expired or revoked.');
      return;
    }

    const message = this.parseClientMessage(rawMessage);

    if (!message) {
      this.send(socket, { type: 'ERROR', code: 'INVALID_MESSAGE', message: 'Invalid WebSocket message.' });
      return;
    }

    const result = actor.handleClientMessage({
      actorId: attachment.actorId,
      role: attachment.role
    }, message);

    for (const directMessage of result.directMessages) {
      this.send(socket, directMessage);
    }

    if (result.broadcastEvent) {
      this.broadcast(result.broadcastEvent);
    }

    if (result.shouldBroadcastViews) {
      this.broadcastViews(actor);
    }

    if (result.isActivity) {
      await this.saveSnapshot(actor);
    }
  }

  async webSocketClose(socket: WebSocket) {
    await this.detachSocket(socket);
  }

  async webSocketError(socket: WebSocket) {
    await this.detachSocket(socket);
  }

  async alarm() {
    const snapshot = await this.state.storage.get<GameSessionSnapshot>(SESSION_SNAPSHOT_KEY);

    if (!snapshot) {
      await this.state.storage.deleteAlarm();
      return;
    }

    const connectedCount = this.getValidSockets().length;
    const nextLifecycle = advanceRoomLifecycle(snapshot, {
      connectedCount,
      now: new Date()
    });

    if (nextLifecycle.roomStatus !== snapshot.roomStatus || nextLifecycle.closedAt !== snapshot.closedAt) {
      const nextSnapshot: GameSessionSnapshot = {
        ...snapshot,
        ...nextLifecycle,
        updatedAt: new Date().toISOString()
      };
      await this.state.storage.put(SESSION_SNAPSHOT_KEY, nextSnapshot);

      if (this.actor) {
        this.actor.setRoomStatus(nextSnapshot.roomStatus, nextSnapshot.closedAt);
      }

      this.broadcast({
        type: 'ROOM_STATUS_CHANGED',
        sessionId: snapshot.sessionId,
        status: nextSnapshot.roomStatus
      });

      if (nextSnapshot.roomStatus === 'idle_checking' && connectedCount > 0) {
        this.broadcast({
          type: 'IDLE_CHECK',
          sessionId: snapshot.sessionId,
          message: '房间空闲，是否继续？',
          expiresAt: nextSnapshot.expiresAt
        });
      }

      await this.scheduleLifecycleAlarm(nextSnapshot);
      return;
    }

    await this.scheduleLifecycleAlarm(snapshot);
  }

  private getSessionId(request: Request) {
    return new URL(request.url).searchParams.get('sessionId') ?? this.actor?.sessionId ?? null;
  }

  private getPublicOrigin(request: Request) {
    return new URL(request.url).searchParams.get('origin') ?? getOrigin(request.url);
  }

  private async loadActor(sessionId: string) {
    if (this.actor) {
      return this.actor;
    }

    const snapshot = await this.state.storage.get<GameSessionSnapshot>(SESSION_SNAPSHOT_KEY);

    if (!snapshot || snapshot.sessionId !== sessionId || snapshot.version !== 1) {
      return null;
    }

    this.actor = GameSessionActor.fromSnapshot({
      snapshot,
      onChange: (changedActor) => {
        void this.saveSnapshot(changedActor);
      }
    });
    return this.actor;
  }

  private async saveSnapshot(actor: GameSessionActor) {
    const snapshot = actor.toSnapshot();
    await this.state.storage.put(SESSION_SNAPSHOT_KEY, snapshot);
    await this.scheduleLifecycleAlarm(snapshot);
  }

  private async scheduleLifecycleAlarm(snapshot: GameSessionSnapshot) {
    if (snapshot.roomStatus === 'closed' || snapshot.roomStatus === 'abandoned') {
      await this.state.storage.deleteAlarm();
      return;
    }

    await this.state.storage.setAlarm(getNextLifecycleAlarm(snapshot));
  }

  private async detachSocket(socket: WebSocket) {
    const attachment = socket.deserializeAttachment();

    if (!isValidSocketAttachment(attachment)) {
      return;
    }

    const actor = await this.loadActor(attachment.sessionId);

    if (!actor) {
      return;
    }

    actor.markDisconnected(attachment.actorId);
    await this.saveSnapshot(actor);
    this.broadcastViews(actor);
  }

  private parseClientMessage(rawMessage: string | ArrayBuffer): ClientToServerMessage | null {
    if (typeof rawMessage !== 'string') {
      return null;
    }

    try {
      const parsed = parseClientToServerMessage(JSON.parse(rawMessage));
      return parsed.ok ? parsed.value : null;
    } catch {
      return null;
    }
  }

  private getValidSockets() {
    return this.state.getWebSockets().filter((socket) => isValidSocketAttachment(socket.deserializeAttachment()));
  }

  private broadcast(message: ServerToClientMessage) {
    for (const socket of this.getValidSockets()) {
      this.send(socket, message);
    }
  }

  private broadcastViews(actor: GameSessionActor) {
    for (const socket of this.getValidSockets()) {
      const attachment = socket.deserializeAttachment();

      if (isValidSocketAttachment(attachment) && attachment.sessionId === actor.sessionId) {
        this.send(socket, actor.getViewUpdateForParticipant(attachment.actorId, attachment.role));
      }
    }
  }

  private send(socket: WebSocket, message: ServerToClientMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }
}
