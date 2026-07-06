// Local environment readiness check.
// Run: corepack pnpm check:local

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const failed = [];

function check(label, fn) {
  try {
    fn();
    console.log(`  [OK] ${label}`);
  } catch (err) {
    console.log(`  [FAIL] ${label}: ${err.message}`);
    failed.push(label);
  }
}

console.log('Ludoria Local Environment Check\n');

check('Node >= 20', () => {
  const v = process.versions.node;
  const major = parseInt(v.split('.')[0], 10);
  if (major < 20) throw new Error(`Node ${v} found, need >= 20`);
});

check('pnpm available', () => {
  execSync('pnpm --version', { stdio: 'pipe' });
});

check('wrangler available', () => {
  execSync('npx wrangler --version', { stdio: 'pipe' });
});

check('apps/worker/wrangler.toml exists', () => {
  if (!existsSync(resolve(root, 'apps/worker/wrangler.toml'))) {
    throw new Error('not found');
  }
});

check('packages/db/migrations has SQL files', () => {
  const dir = resolve(root, 'packages/db/migrations');
  if (!existsSync(dir)) throw new Error('directory not found');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql'));
  if (files.length === 0) throw new Error('no SQL migration files');
});

check('.env.example exists', () => {
  if (!existsSync(resolve(root, '.env.example'))) {
    throw new Error('not found');
  }
});

check('package.json has required scripts', () => {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const required = ['dev:web', 'dev:worker', 'typecheck', 'test', 'build'];
  for (const script of required) {
    if (!pkg.scripts[script]) throw new Error(`missing script: ${script}`);
  }
});

console.log(`\n${failed.length === 0 ? 'All checks passed.' : `${failed.length} check(s) failed.`}`);
if (failed.length > 0) {
  console.log('Failed:');
  failed.forEach((c) => console.log(`  - ${c}`));
  process.exit(1);
}
