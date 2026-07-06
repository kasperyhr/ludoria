// Seed the local D1 game_catalog table.
// Requires Wrangler and local D1 to be available.
// Run: corepack pnpm db:seed:local

import { execSync } from 'node:child_process';

const WORKER_DIR = 'apps/worker';
const commands = [
  'INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES',
  "('token-bluffing-demo', 'Token Bluffing Demo', 'multiplayer', 'preview', '最小多人隐藏信息 demo', '2-6 players', datetime('now'), datetime('now'))",
  "ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');",
  '',
  'INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES',
  "('sudoku-lite', 'Sudoku Lite', 'solo', 'preview', '4x4 单人数独 demo', 'Solo', datetime('now'), datetime('now'))",
  "ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');",
  '',
  'INSERT INTO game_catalog (id, name, mode, status, description, player_count_label, created_at, updated_at) VALUES',
  "('nonogram', 'Nonogram', 'solo', 'planned', '单人数织 puzzle', 'Solo', datetime('now'), datetime('now'))",
  "ON CONFLICT(id) DO UPDATE SET updated_at = datetime('now');",
];

const sql = commands.join('\n');

console.log('Seeding local D1 game_catalog...\n');
try {
  execSync(`npx wrangler d1 execute ludoria-db --local --command="${sql.replace(/"/g, '\\"')}"`, {
    cwd: WORKER_DIR,
    stdio: 'inherit',
    shell: true,
  });
  console.log('\nSeed complete.');
} catch (err) {
  // If the worker wrangler doesn't have D1 set up yet, try from root
  console.log('Trying from project root...');
  try {
    execSync(`npx wrangler d1 execute ludoria-db --local --command="${sql.replace(/"/g, '\\"')}"`, {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: true,
    });
    console.log('\nSeed complete.');
  } catch (err2) {
    console.error('Seed failed. Make sure wrangler dev has been run at least once to initialize local D1.');
    console.error('You can also seed manually via the worker: it auto-seeds game_catalog on first /api/games read.');
    process.exit(1);
  }
}
