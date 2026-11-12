/**
 * serve.mjs — Servidor estático mínimo para desarrollo local.
 * Uso: npm run serve  (http://localhost:8123)
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.env.PORT ?? 8123);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8',
  '.ico': 'image/x-icon',
};

const server = http.createServer((request, response) => {
  const url = decodeURIComponent((request.url ?? '/').split('?')[0]);
  const requested = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const file = path.resolve(ROOT, requested);

  if (!file.startsWith(ROOT)) {
    response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Acceso denegado');
    return;
  }

  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Archivo no encontrado');
      return;
    }

    const type = TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(response);
  });
});

server.listen(PORT, () => {
  console.log(`PlasTrack disponible en http://localhost:${PORT}`);
});
