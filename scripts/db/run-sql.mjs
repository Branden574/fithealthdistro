// Runs SQL through the Supabase CLI against the local stack, or the linked hosted project with --linked.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const linked = process.argv.includes('--linked');

/** Quotes a value as a SQL string literal. */
export const literal = (value) => `'${String(value).replace(/'/g, "''")}'`;

export function runSql(sql) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fhd-sql-'));
  const file = path.join(dir, 'query.sql');
  fs.writeFileSync(file, sql, { mode: 0o600 });
  try {
    return execFileSync('supabase', ['db', 'query', '--agent', 'no', '-o', 'json', '-f', file, linked ? '--linked' : '--local'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

export function arg(name) {
  const at = process.argv.indexOf(`--${name}`);
  return at > -1 ? process.argv[at + 1] : undefined;
}
