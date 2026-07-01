import type { ApiError, ProtocolErrorCode } from '@ludoria/protocol';

export const localCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export function apiError(code: ProtocolErrorCode, message: string): ApiError {
  return { ok: false, code, message };
}

export function getOrigin(url: string) {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.host}`;
}
