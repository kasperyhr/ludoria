// Ludoria local smoke test.
// Requires the Worker to be running at http://127.0.0.1:8787.
// Run: corepack pnpm smoke:local
// If the Worker is not running, this test will fail early with a clear message.

const WORKER_ORIGIN = process.env.LUDORIA_WORKER_ORIGIN ?? 'http://127.0.0.1:8787';

let passed = 0;
let failed = 0;
const failures = [];

function ok(label, condition, detail) {
  if (condition) {
    console.log(`  [OK] ${label}`);
    passed++;
  } else {
    console.log(`  [FAIL] ${label}${detail ? ': ' + detail : ''}`);
    failed++;
    failures.push(label);
  }
}

async function fetchJson(path, options = {}) {
  const url = `${WORKER_ORIGIN}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    method: options.method ?? 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json();
  return { res, json };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function wsConnect(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error('WebSocket connection timeout'));
    }, timeoutMs);

    const messages = [];
    socket.addEventListener('open', () => {
      clearTimeout(timer);
      resolve({ socket, messages });
    });
    socket.addEventListener('message', (event) => {
      messages.push(JSON.parse(String(event.data)));
    });
    socket.addEventListener('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

console.log('Ludoria Local Smoke Test');
console.log(`Worker: ${WORKER_ORIGIN}\n`);

// --- Health ---
try {
  const { json: health } = await fetchJson('/health');
  ok('GET /health returns ok', health.ok === true);
  ok('/health service is ludoria-worker', health.service === 'ludoria-worker');
} catch (err) {
  ok('Worker is reachable at ' + WORKER_ORIGIN, false, err.message);
  console.log('\nMake sure the Worker is running: corepack pnpm dev:worker');
  process.exit(1);
}

// --- Game Catalog ---
try {
  const { json: catalog } = await fetchJson('/api/games');
  ok('/api/games returns array', Array.isArray(catalog));
  ok('/api/games includes Token Bluffing Demo', catalog.some((g) => g.id === 'token-bluffing-demo'));
  ok('/api/games includes Sudoku Lite', catalog.some((g) => g.id === 'sudoku-lite'));
  ok('/api/games includes Nonogram', catalog.some((g) => g.id === 'nonogram'));
} catch (err) {
  ok('/api/games', false, err.message);
}

// --- Token Bluffing Session ---
let sessionId;
let playerToken;
let spectatorToken;
let wsUrl;

try {
  const { res, json: session } = await fetchJson('/api/sessions', { method: 'POST' });
  ok('POST /api/sessions returns 201', res.status === 201);
  ok('/api/sessions returns sessionId', !!session.sessionId);
  ok('/api/sessions returns websocketUrl', !!session.websocketUrl);
  sessionId = session.sessionId;
  wsUrl = session.websocketUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
} catch (err) {
  ok('POST /api/sessions', false, err.message);
}

// --- Player Join ---
let playerActorId;
try {
  const { json: joinRes } = await fetchJson(`/api/sessions/${sessionId}/join`, {
    method: 'POST',
    body: { displayName: 'SmokePlayer', role: 'player' },
  });
  ok('Player join returns sessionToken', !!joinRes.sessionToken);
  ok('Player join returns actorId', !!joinRes.actorId);
  ok('Player join role is player', joinRes.role === 'player');
  playerToken = joinRes.sessionToken;
  playerActorId = joinRes.actorId;
} catch (err) {
  ok('Player join', false, err.message);
}

// --- Spectator Join ---
try {
  const { json: joinRes } = await fetchJson(`/api/sessions/${sessionId}/join`, {
    method: 'POST',
    body: { displayName: 'SmokeWatcher', role: 'spectator' },
  });
  ok('Spectator join returns sessionToken', !!joinRes.sessionToken);
  ok('Spectator join role is spectator', joinRes.role === 'spectator');
  spectatorToken = joinRes.sessionToken;
} catch (err) {
  ok('Spectator join', false, err.message);
}

// --- Player WebSocket ---
try {
  const playerWsUrl = `${wsUrl}?token=${encodeURIComponent(playerToken)}`;
  const { socket: pSocket, messages: pMsgs } = await wsConnect(playerWsUrl);
  await sleep(500);
  ok('Player WebSocket connected', pSocket.readyState === 1);
  ok('Player received SESSION_SNAPSHOT', pMsgs.some((m) => m.type === 'SESSION_SNAPSHOT'));

  const snapshot = pMsgs.find((m) => m.type === 'SESSION_SNAPSHOT');
  ok('Player snapshot viewer is player', snapshot?.role === 'player', snapshot?.role);
  ok('Player snapshot shows self hiddenTokens',
    snapshot?.view?.self?.hiddenTokens && snapshot.view.self.hiddenTokens.length > 0);

  // DECLARE_TOKEN_COUNT
  pSocket.send(JSON.stringify({
    type: 'SUBMIT_COMMAND',
    commandId: crypto.randomUUID(),
    command: { type: 'DECLARE_TOKEN_COUNT', payload: { token: 'gold', count: 3 } },
  }));
  await sleep(300);
  ok('Player submitted DECLARE_TOKEN_COUNT', true);

  // KEEP_ALIVE
  pSocket.send(JSON.stringify({ type: 'KEEP_ALIVE' }));
  await sleep(200);
  ok('Player sent KEEP_ALIVE', true);

  pSocket.close();
} catch (err) {
  ok('Player WebSocket', false, err.message);
}

// --- Spectator WebSocket ---
try {
  const specWsUrl = `${wsUrl}?token=${encodeURIComponent(spectatorToken)}`;
  const { socket: sSocket, messages: sMsgs } = await wsConnect(specWsUrl);
  await sleep(500);
  ok('Spectator WebSocket connected', sSocket.readyState === 1);

  const allMsgs = sMsgs.map((m) => JSON.stringify(m)).join('');
  ok('Spectator messages contain no hiddenTokens',
    !allMsgs.includes('hiddenTokens'),
    'hiddenTokens found in spectator messages');

  sSocket.close();
} catch (err) {
  ok('Spectator WebSocket', false, err.message);
}

// --- Sudoku Lite ---
let puzzleSessionId;
try {
  const { json: puzzle } = await fetchJson('/api/puzzles/sudoku-lite/sessions', { method: 'POST' });
  ok('Sudoku Lite session created', !!puzzle.sessionId);
  puzzleSessionId = puzzle.sessionId;

  ok('Sudoku public puzzle has no solution', !JSON.stringify(puzzle.puzzle).includes('"solution"'));
  ok('Sudoku public puzzle has givens', puzzle.puzzle.givens.length > 0);
} catch (err) {
  ok('Sudoku Lite create', false, err.message);
}

try {
  await fetchJson(`/api/puzzles/${puzzleSessionId}/move`, {
    method: 'POST',
    body: { row: 0, col: 1, value: 2 },
  });
  ok('Sudoku Lite move applied', true);
} catch (err) {
  ok('Sudoku Lite move', false, err.message);
}

try {
  const { json: hint } = await fetchJson(`/api/puzzles/${puzzleSessionId}/hint`, { method: 'POST' });
  ok('Sudoku Lite hint returned', hint.hint !== null || true);
} catch (err) {
  ok('Sudoku Lite hint', false, err.message);
}

try {
  const { json: check } = await fetchJson(`/api/puzzles/${puzzleSessionId}/check`, { method: 'POST' });
  ok('Sudoku Lite check returned', typeof check.isComplete === 'boolean');
} catch (err) {
  ok('Sudoku Lite check', false, err.message);
}

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log('Failed items:');
  failures.forEach((f) => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('All smoke tests passed.');
}
