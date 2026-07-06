import { Hono } from "hono";
import {
  insertGameSession,
  insertSessionPlayer,
  updateGameSessionCounts,
} from "@ludoria/db";
import type { WorkerEnv } from "../env";
import { apiError, getOrigin } from "../http";
import { createMetadataDb } from "../services/metadata";

export const multiplayerSessionRoutes = new Hono<{ Bindings: WorkerEnv }>();

function getSessionStub(env: WorkerEnv, sessionId: string) {
  return env.GAME_SESSION_OBJECT.get(env.GAME_SESSION_OBJECT.idFromName(sessionId));
}

function objectUrl(pathname: string, c: { req: { url: string } }, params: Record<string, string> = {}) {
  const url = new URL(`https://game-session-object.local${pathname}`);
  url.searchParams.set("origin", getOrigin(c.req.url));

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

multiplayerSessionRoutes.post("/api/sessions", async (c) => {
  const sessionId = `session-${crypto.randomUUID()}`;
  const stub = getSessionStub(c.env, sessionId);
  const response = await stub.fetch(objectUrl("/create", c), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  if (response.ok) {
    try {
      const db = createMetadataDb(c.env.DB);
      await insertGameSession(db, {
        id: sessionId,
        gameId: "token-bluffing-demo",
        durableObjectName: sessionId,
      });
    } catch (err) {
      console.warn("D1 game_sessions insert failed for", sessionId, ":", String(err));
    }
  }

  return response;
});

multiplayerSessionRoutes.post("/api/sessions/:sessionId/join", async (c) => {
  const sessionId = c.req.param("sessionId");
  const stub = getSessionStub(c.env, sessionId);
  const response = await stub.fetch(new Request(objectUrl("/join", c, { sessionId }), c.req.raw));

  if (response.ok) {
    try {
      const body = await response.clone().json<{ role: string; actorId: string; displayName?: string }>();
      const db = createMetadataDb(c.env.DB);
      const participantDelta = body.role === "player" ? 1 : 0;
      const spectatorDelta = body.role === "spectator" ? 1 : 0;

      await Promise.all([
        insertSessionPlayer(db, {
          id: `sp-${crypto.randomUUID()}`,
          sessionId,
          actorId: body.actorId,
          displayName: body.displayName ?? body.role,
          role: body.role as "player" | "spectator",
        }),
        updateGameSessionCounts(db, sessionId, { participantDelta, spectatorDelta }),
      ]);
    } catch (err) {
      console.warn("D1 session_players write failed for", sessionId, ":", String(err));
    }
  }

  return response;
});

multiplayerSessionRoutes.get("/api/sessions/:sessionId/connect", (c) => {
  const sessionId = c.req.param("sessionId");
  const sessionToken = new URL(c.req.url).searchParams.get("token");

  if (!sessionToken) {
    return c.json(apiError("SESSION_NOT_FOUND", "Session or token not found."), 404);
  }

  const stub = getSessionStub(c.env, sessionId);
  const url = objectUrl("/connect", c, { sessionId, token: sessionToken });
  return stub.fetch(new Request(url, c.req.raw));
});
