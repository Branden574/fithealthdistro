/** The answer to a one-click change in the admin (a switch, a status, a removal). */
export type QuickResult = { ok: true } | { ok: false; reason: 'signed-out' | 'missing' | 'error' };

/** A Postgres error code from a Supabase error, if there is one. */
export function errorCode(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : undefined;
}

/** Logs a failed admin action by its message only: never the values the admin typed. */
export function logFailure(where: string, error: unknown) {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : 'unknown error';
  console.error(`${where} failed: ${message}`);
}
