import type { CreateSessionResponse } from '@ludoria/protocol';
import { parseJoinSessionRequest } from '@ludoria/protocol';
import type { WorkerEnv } from '../env';
import { apiError, getOrigin } from '../http';
import { GameSessionActor } from '../game-session-actor';

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

    this.ensureActor(body.sessionId);

    const response: CreateSessionResponse = {
      sessionId: body.sessionId,
      gameId: 'token-bluffing-demo',
      websocketUrl: `${this.getPublicOrigin(request)}/api/sessions/${body.sessionId}/connect`
    };

    return Response.json(response, { status: 201 });
  }

  private async joinSession(request: Request) {
    const sessionId = this.getSessionId(request);
    const actor = this.actor;

    if (!sessionId || !actor) {
      return Response.json(apiError('SESSION_NOT_FOUND', 'Session not found.'), { status: 404 });
    }

    const input = await request.json().catch(() => null);
    const parsed = parseJoinSessionRequest(input);

    if (!parsed.ok) {
      return Response.json(apiError('INVALID_MESSAGE', parsed.message), { status: 400 });
    }

    const response = actor.join(parsed.value.displayName, parsed.value.role);

    return Response.json({
      ...response,
      websocketUrl: `${this.getPublicOrigin(request)}${response.websocketUrl}`
    });
  }

  private connect(request: Request) {
    const actor = this.actor;
    const sessionToken = new URL(request.url).searchParams.get('token');

    if (!actor || !sessionToken) {
      return Response.json(apiError('SESSION_NOT_FOUND', 'Session or token not found.'), { status: 404 });
    }

    const upgradeHeader = request.headers.get('Upgrade');

    if (upgradeHeader !== 'websocket') {
      return Response.json(apiError('INVALID_MESSAGE', 'Expected WebSocket upgrade.'), { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
    server.accept();
    actor.connect(server, sessionToken);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  private ensureActor(sessionId: string) {
    if (!this.actor) {
      this.actor = new GameSessionActor(sessionId);
    }

    return this.actor;
  }

  private getSessionId(request: Request) {
    return new URL(request.url).searchParams.get('sessionId') ?? this.actor?.sessionId ?? null;
  }

  private getPublicOrigin(request: Request) {
    return new URL(request.url).searchParams.get('origin') ?? getOrigin(request.url);
  }
}
