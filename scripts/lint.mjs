import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules', 'dist', '.turbo', '.wrangler']);
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.md', '.json', '.css', '.toml', '.yaml', '.yml']);
const problems = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
    } else if (exts.has(path.extname(entry.name))) {
      const text = await readFile(full, 'utf8');
      const rel = path.relative(root, full);
      if (!text.endsWith('\n')) problems.push(rel + ': missing final newline');
      if (/\t/.test(text)) problems.push(rel + ': tab character found');
    }
  }
}

await walk(root);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log('lint placeholder checks passed');
