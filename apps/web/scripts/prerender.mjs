/**
 * Post-build SSG pre-render script (Phase D1).
 *
 * Sequence:
 *   vite build                             → dist/          (client bundle)
 *   vite build --ssr src/entry-server.tsx  → dist/server/   (SSR bundle)
 *   node scripts/prerender.mjs             → injects rendered HTML into dist/index.html
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const { render } = await import(resolve(root, 'dist/server/entry-server.js'));

const template = readFileSync(resolve(root, 'dist/index.html'), 'utf-8');
const appHtml = render('/');
const output = template.replace('<!--app-html-->', appHtml);

writeFileSync(resolve(root, 'dist/index.html'), output);
console.log('✓  Pre-rendered / → dist/index.html');
