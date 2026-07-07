// Preview web UI smoke test. Checks that the Worker serves the Web UI at /.
// Requires the Worker to be running. Set LUDORIA_WORKER_ORIGIN.
// Run: corepack pnpm smoke:web-preview

const WORKER_ORIGIN = process.env.LUDORIA_WORKER_ORIGIN;

if (!WORKER_ORIGIN) {
  console.error('LUDORIA_WORKER_ORIGIN is required. Example:');
  console.error('  $env:LUDORIA_WORKER_ORIGIN="https://ludoria-worker.kasperyhr.workers.dev"');
  process.exit(1);
}

let passed = 0;
let failed = 0;

function ok(label, condition, detail) {
  if (condition) { console.log('  [OK] ' + label); passed++; }
  else { console.log('  [FAIL] ' + label + (detail ? ': ' + detail : '')); failed++; }
}

async function fetchText(path) {
  const res = await fetch(WORKER_ORIGIN + path);
  const text = await res.text();
  return { res, text };
}

async function fetchJson(path) {
  const res = await fetch(WORKER_ORIGIN + path);
  const json = await res.json();
  return { res, json };
}

console.log('Ludoria Web UI Smoke Test');
console.log('Worker: ' + WORKER_ORIGIN + '\n');

// Test 1: GET / returns HTML (not JSON)
try {
  const { res, text } = await fetchText('/');
  const isHtml = res.headers.get('content-type')?.includes('text/html') ?? false;
  ok('GET / returns HTML content-type', isHtml, res.headers.get('content-type'));
  ok('GET / contains Ludoria', text.includes('Ludoria'));
  ok('GET / is not JSON error', !text.includes('"route not found"'));
  ok('GET / status is 200', res.status === 200);
} catch (err) {
  ok('GET / returns UI', false, err.message);
}

// Test 2: GET /health still returns JSON
try {
  const { json } = await fetchJson('/health');
  ok('GET /health returns ok:true', json.ok === true);
  ok('GET /health service is ludoria-worker', json.service === 'ludoria-worker');
} catch (err) {
  ok('GET /health', false, err.message);
}

// Test 3: GET /api/games still returns JSON array
try {
  const { json } = await fetchJson('/api/games');
  ok('GET /api/games returns array', Array.isArray(json));
  ok('/api/games not empty', json.length > 0);
} catch (err) {
  ok('GET /api/games', false, err.message);
}

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
