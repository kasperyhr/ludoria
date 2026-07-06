import { eq, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';
import type {
  GameCatalogItem,
  RoomStatus,
  SessionRole,
} from '@ludoria/protocol';

export type MetadataDb = DrizzleD1Database<typeof schema>;

export async function getGameCatalogFromDb(db: MetadataDb): Promise<GameCatalogItem[]> {
  const rows = await db.select().from(schema.gameCatalog).all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mode: row.mode as GameCatalogItem['mode'],
    status: row.status as GameCatalogItem['status'],
    description: row.description,
    playerCountLabel: row.playerCountLabel,
  }));
}

export async function seedGameCatalogIfEmpty(db: MetadataDb): Promise<number> {
  const existing = await db.select({ id: schema.gameCatalog.id }).from(schema.gameCatalog).all();

  if (existing.length > 0) {
    return 0;
  }

  const { seedGameCatalog } = await import('./seed-data');
  let inserted = 0;

  for (const entry of seedGameCatalog) {
    await db.insert(schema.gameCatalog).values(entry).onConflictDoNothing().run();
    inserted += 1;
  }

  return inserted;
}

export interface InsertGameSessionParams {
  id: string;
  gameId: string;
  durableObjectName: string;
  expiresAt?: string;
}

export async function insertGameSession(db: MetadataDb, params: InsertGameSessionParams) {
  await db.insert(schema.gameSessions).values({
    id: params.id,
    gameId: params.gameId,
    status: 'active',
    roomStatus: 'active',
    durableObjectName: params.durableObjectName,
    expiresAt: params.expiresAt ?? null,
  }).onConflictDoNothing().run();
}

export async function updateGameSessionCounts(
  db: MetadataDb,
  sessionId: string,
  deltas: { participantDelta?: number; spectatorDelta?: number }
) {
  const set: Record<string, unknown> = {};
  const additive: string[] = [];

  if (deltas.participantDelta) {
    additive.push(`participant_count + ${deltas.participantDelta}`);
  }

  if (deltas.spectatorDelta) {
    additive.push(`spectator_count + ${deltas.spectatorDelta}`);
  }

  if (additive.length === 0) {
    return;
  }

  await db.update(schema.gameSessions)
    .set({
      participantCount: sql`participant_count + ${deltas.participantDelta ?? 0}`,
      spectatorCount: sql`spectator_count + ${deltas.spectatorDelta ?? 0}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.gameSessions.id, sessionId))
    .run();
}

export interface InsertSessionPlayerParams {
  id: string;
  sessionId: string;
  actorId: string;
  displayName: string;
  role: SessionRole;
}

export async function insertSessionPlayer(db: MetadataDb, params: InsertSessionPlayerParams) {
  await db.insert(schema.sessionPlayers).values({
    id: params.id,
    sessionId: params.sessionId,
    actorId: params.actorId,
    displayName: params.displayName,
    role: params.role,
  }).onConflictDoNothing().run();
}

export interface InsertPuzzleSessionParams {
  id: string;
  gameId: string;
  puzzleId: string;
}

export async function insertPuzzleSession(db: MetadataDb, params: InsertPuzzleSessionParams) {
  await db.insert(schema.puzzleSessions).values({
    id: params.id,
    gameId: params.gameId,
    puzzleId: params.puzzleId,
    status: 'active',
  }).onConflictDoNothing().run();
}

export async function updatePuzzleProgress(
  db: MetadataDb,
  puzzleSessionId: string,
  progressJson: string,
  moveCount: number
) {
  const existing = await db
    .select({ id: schema.puzzleProgress.id })
    .from(schema.puzzleProgress)
    .where(eq(schema.puzzleProgress.puzzleSessionId, puzzleSessionId))
    .get();

  if (existing) {
    await db.update(schema.puzzleProgress)
      .set({ progressJson, updatedAt: new Date().toISOString() })
      .where(eq(schema.puzzleProgress.id, existing.id))
      .run();
  } else {
    await db.insert(schema.puzzleProgress).values({
      id: `progress-${crypto.randomUUID()}`,
      puzzleSessionId,
      progressJson,
    }).onConflictDoNothing().run();
  }

  await db.update(schema.puzzleSessions)
    .set({ moveCount, updatedAt: new Date().toISOString() })
    .where(eq(schema.puzzleSessions.id, puzzleSessionId))
    .run();
}

export async function markPuzzleCompleted(
  db: MetadataDb,
  puzzleSessionId: string
) {
  const now = new Date().toISOString();

  await db.update(schema.puzzleSessions)
    .set({ status: 'completed', completedAt: now, updatedAt: now })
    .where(eq(schema.puzzleSessions.id, puzzleSessionId))
    .run();
}
