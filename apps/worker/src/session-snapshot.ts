import type { TokenBluffingState } from '@ludoria/game-definitions';
import type { ChatMessage, SessionRole } from '@ludoria/protocol';

export const SESSION_SNAPSHOT_KEY = 'session:snapshot';
export const SESSION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
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
  createdAt: string;
  updatedAt: string;
}

export function createTokenExpiry(now = new Date()) {
  return new Date(now.getTime() + SESSION_TOKEN_TTL_MS).toISOString();
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
