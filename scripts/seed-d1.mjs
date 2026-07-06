// Seed the local D1 game_catalog table.
// Requires Wrangler and local D1 to be available.
// Run: corepack pnpm db:seed:local

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const sql = `
INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES
  ('token-bluffing-demo', 'Token Bluffing Demo', 'multiplayer', 'preview', '最小多人隐藏信息 demo', '2-6 players', datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');

INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES
  ('sudoku-lite', 'Sudoku Lite', 'solo', 'preview', '4x4 单人数独 demo', 'Solo', datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');

INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES
  ('nonogram', 'Nonogram', 'solo', 'planned', '单人数织 puzzle', 'Solo', datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');
`.trim();

const seedFile = join(tmpdir(), 'ludoria-seed-game-catalog.sql');
writeFileSync(seedFile, sql, 'utf8');

console.log('Seeding local D1 game_catalog...');

try {
  execSync(`npx wrangler d1 execute ludoria-db --local --config apps/worker/wrangler.toml --file="${seedFile}"`, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });
  console.log('\nSeed complete.');
} catch (err) {
  console.error('Seed failed. Make sure wrangler dev has been run at least once to initialize local D1.');
  console.error('You can also seed via the worker: it auto-seeds game_catalog on first /api/games read.');
  process.exitCode = 1;
} finally {
  try { unlinkSync(seedFile); } catch { /* ok */ }
}
