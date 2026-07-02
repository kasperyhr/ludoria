import type { TokenBluffingState } from '@ludoria/game-definitions';
import type { ChatMessage, RoomStatus, SessionRole } from '@ludoria/protocol';

export const SESSION_SNAPSHOT_KEY = 'session:snapshot';
export const SESSION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
export const ROOM_IDLE_CHECK_MS = 30 * 60 * 1000;
export const MAX_CHAT_MESSAGES = 100;

export interface GameSessionSnapshotParticipant {
  actorId: string;
  displayName: string;
  role: SessionRole;
  sessionTokenHash: string;
  tokenExpiresAt: string;
  revokedAt?: string;
}

export interface GameSessionSnapshot {
  version: 1;
  sessionId: string;
  gameId: 'token-bluffing-demo';
  state: TokenBluffingState;
  participants: GameSessionSnapshotParticipant[];
  chatMessages: ChatMessage[];
  roomStatus: RoomStatus;
  expiresAt: string;
  idleCheckAt: string;
  lastActivityAt: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameSessionSocketAttachment {
  sessionId: string;
  actorId: string;
  role: SessionRole;
  sessionTokenHash: string;
}

export function createTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + SESSION_TOKEN_TTL_MS).toISOString();
}

export function createRoomLifecycle(now = new Date()) {
  return {
    roomStatus: 'active' as const,
    expiresAt: new Date(now.getTime() + ROOM_TTL_MS).toISOString(),
    idleCheckAt: new Date(now.getTime() + ROOM_IDLE_CHECK_MS).toISOString(),
    lastActivityAt: now.toISOString()
  };
}

export function advanceRoomLifecycle(
  snapshot: Pick<GameSessionSnapshot, 'roomStatus' | 'expiresAt' | 'idleCheckAt' | 'lastActivityAt' | 'closedAt'>,
  options: { now?: Date; connectedCount: number }
) {
  const now = options.now ?? new Date();
  const nowMs = now.getTime();
  const expiresAtMs = Date.parse(snapshot.expiresAt);
  const idleCheckAtMs = Date.parse(snapshot.idleCheckAt);

  if (snapshot.roomStatus === 'closed' || snapshot.roomStatus === 'abandoned') {
    return snapshot;
  }

  if (nowMs >= expiresAtMs && options.connectedCount === 0) {
    return {
      ...snapshot,
      roomStatus: 'abandoned' as const,
      closedAt: now.toISOString()
    };
  }

  if (nowMs >= idleCheckAtMs) {
    return {
      ...snapshot,
      roomStatus: 'idle_checking' as const
    };
  }

  return snapshot;
}

export function touchRoomActivity(snapshot: GameSessionSnapshot, now = new Date()): GameSessionSnapshot {
  return {
    ...snapshot,
    roomStatus: 'active',
    idleCheckAt: new Date(now.getTime() + ROOM_IDLE_CHECK_MS).toISOString(),
    lastActivityAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}

export function getNextLifecycleAlarm(snapshot: Pick<GameSessionSnapshot, 'roomStatus' | 'idleCheckAt' | 'expiresAt'>) {
  if (snapshot.roomStatus === 'idle_checking') {
    return Date.parse(snapshot.expiresAt);
  }

  return Math.min(Date.parse(snapshot.idleCheckAt), Date.parse(snapshot.expiresAt));
}

export function isValidSocketAttachment(value: unknown): value is GameSessionSocketAttachment {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<GameSessionSocketAttachment>;
  return typeof candidate.sessionId === 'string'
    && typeof candidate.actorId === 'string'
    && (candidate.role === 'player' || candidate.role === 'spectator')
    && typeof candidate.sessionTokenHash === 'string';
}

export function isParticipantTokenActive(
  participant: Pick<GameSessionSnapshotParticipant, 'tokenExpiresAt' | 'revokedAt'>,
  now = new Date()
) {
  if (participant.revokedAt) {
    return false;
  }

  return Date.parse(participant.tokenExpiresAt) > now.getTime();
}

export function trimChatMessages(messages: ChatMessage[]) {
  return messages.slice(-MAX_CHAT_MESSAGES);
}

export function snapshotContainsToken(snapshot: GameSessionSnapshot, token: string) {
  const serialized = JSON.stringify(snapshot);
  return serialized.includes(token);
}

export async function hashSessionToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
