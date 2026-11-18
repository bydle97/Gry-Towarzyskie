/**
 * Minimalny serwer statyczny do podglądu i testów (bez zależności).
 * Uruchomienie z katalogu projektu: node tools/serve.mjs [port]
 * Serwuje folder www/ pod adresem http://127.0.0.1:<port>/ (domyślnie 5510).
 * Słucha tylko na 127.0.0.1 (niedostępny z sieci).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../www/', import.meta.url));
const PORT = Number(process.argv[2]) || 5510;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    let file = normalize(join(ROOT, path));

    // Ochrona przed wyjściem poza www/ („../”).
    const insideRoot = relative(ROOT, file);
    if (insideRoot.startsWith('..') || isAbsolute(insideRoot)) {
      response.writeHead(403).end();
      return;
    }
    if ((await stat(file)).isDirectory()) {
      file = join(file, 'index.html');
    }
    const body = await readFile(file);
    response.writeHead(200, {
      'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('404');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Serwer: http://127.0.0.1:${PORT}/`);
});
