// Preview deployment plan generator.
// Outputs manual steps for Cloudflare preview deployment.
// Does NOT execute any deployment or resource-creation commands.
// Run: corepack pnpm preview:plan

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerPath = resolve(root, 'apps/worker/wrangler.toml');

console.log('=== Ludoria Preview Deploy Plan ===');
console.log('');
console.log('Phase 7A: This plan is for review only. No commands are executed.');
console.log('Phase 7B will execute these steps manually.');
console.log('');

// Check prerequisites
console.log('--- Prerequisites ---');
const checks = [
  ['wrangler.toml exists', existsSync(wranglerPath)],
  ['migrations/ dir exists', existsSync(resolve(root, 'packages/db/migrations'))],
  ['package.json exists', existsSync(resolve(root, 'package.json'))],
  ['.env.example exists', existsSync(resolve(root, '.env.example'))],
];
checks.forEach(([label, ok]) => {
  console.log(`  [${ok ? 'OK' : 'MISSING'}] ${label}`);
});
console.log('');

// Read wrangler.toml to detect current configuration
let hasLocalPlaceholder = false;
let workerName = 'ludoria-worker';
try {
  const wranglerContent = readFileSync(wranglerPath, 'utf8');
  hasLocalPlaceholder = wranglerContent.includes('local-ludoria-db-placeholder');
  const nameMatch = wranglerContent.match(/^name\s*=\s*"([^"]+)"/m);
  if (nameMatch) workerName = nameMatch[1];
} catch { /* ok */ }

if (hasLocalPlaceholder) {
  console.log('Note: wrangler.toml currently uses local placeholder database_id.');
  console.log('This is correct for local dev. Replace before deploying.');
  console.log('');
}

// Output manual steps
console.log('=== Manual Deployment Steps (Phase 7B) ===');
console.log('');
console.log('1. Authenticate (if needed):');
console.log('   [MANUAL] wrangler login');
console.log('');
console.log('2. Create preview D1 database:');
console.log('   [MANUAL] [CREATES RESOURCE] wrangler d1 create ludoria-preview-db --config apps/worker/wrangler.toml');
console.log('   Copy the returned database_id.');
console.log('');
console.log('3. Update wrangler.toml with the preview database_id:');
console.log(`   Replace "local-ludoria-db-placeholder" with the real database_id`);
console.log('   OR use a [env.preview] section (see wrangler.example.toml).');
console.log('');
console.log('4. Apply remote D1 migrations:');
console.log('   [MANUAL] [CREATES RESOURCE] wrangler d1 migrations apply ludoria-db --remote --config apps/worker/wrangler.toml');
console.log('   Migrations: 0000_initial_metadata.sql, 0001_add_metadata_indexes.sql');
console.log('');
console.log('5. Verify Durable Object migration:');
console.log('   DO binding: GAME_SESSION_OBJECT -> GameSessionObject (migration tag: v1)');
console.log('   No changes needed for preview.');
console.log('');
console.log('6. Dry-run deploy (safe, creates nothing):');
console.log('   [MANUAL] [SAFE - DRY RUN] wrangler deploy --config apps/worker/wrangler.toml --dry-run');
console.log('');
console.log('7. Deploy Worker:');
console.log('   [MANUAL] [DEPLOYS] wrangler deploy --config apps/worker/wrangler.toml');
console.log(`   Expected preview URL: https://${workerName}.<your-subdomain>.workers.dev`);
console.log('');
console.log('8. Verify health:');
console.log('   curl https://<preview-url>/health');
console.log('');
console.log('9. Run preview smoke test:');
console.log('   $env:LUDORIA_WORKER_ORIGIN = "https://<preview-url>"');
console.log('   corepack pnpm smoke:preview');
console.log('');
console.log('10. Verify security boundaries:');
console.log('    wrangler d1 execute ludovia-db --remote --config apps/worker/wrangler.toml --command="SELECT sql FROM sqlite_master WHERE type=\'table\';"');
console.log('    Confirm no hiddenTokens, rawToken, or solution columns exist.');
console.log('');
console.log('=== Rollback ===');
console.log('');
console.log('To remove preview resources:');
console.log('   [MANUAL] [DESTRUCTIVE] wrangler delete --config apps/worker/wrangler.toml');
console.log('   Delete D1 database via Cloudflare Dashboard.');
console.log('');
console.log('=== Commands NOT executed by this script ===');
console.log('');
console.log('This script only prints a plan. It does NOT:');
console.log('  - Run wrangler deploy');
console.log('  - Run wrangler d1 create');
console.log('  - Run wrangler d1 migrations apply --remote');
console.log('  - Create any Cloudflare resources');
console.log('');
console.log('See docs/PREVIEW_DEPLOY_RUNBOOK.md for the full runbook.');
