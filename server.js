import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDocument } from './src/document.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

export function createPreviewServer() {
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
      const file = path.resolve(root, relative);
      const extension = path.extname(file).toLowerCase();
      const permitted =
        ['index.html', 'style.css', 'script.js'].includes(relative) ||
        /^(src|config|styles|assets|data)\//.test(relative);
      if (
        !permitted ||
        !file.startsWith(root + path.sep) ||
        !types[extension] ||
        relative.includes('\\') ||
        relative.split('/').some((part) => part.startsWith('.'))
      ) {
        response.writeHead(404);
        response.end('Not found');
        return;
      }
      let data = await readFile(file);
      if (relative === 'index.html') data = Buffer.from(prepareDocument(data.toString('utf8')));
      const headers = {
        'Content-Type': types[extension],
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      };
      let status = 200;
      // Browsers request byte ranges to seek and replay local video and audio.
      if (['.mp4', '.webm', '.mp3', '.m4a', '.ogg'].includes(extension)) {
        headers['Accept-Ranges'] = 'bytes';
        const range = request.headers.range;
        if (range) {
          const match = /^bytes=(\d*)-(\d*)$/.exec(range);
          const start = match?.[1]
            ? Number(match[1])
            : Math.max(0, data.length - Number(match?.[2]));
          const end =
            match?.[1] && match[2] ? Math.min(Number(match[2]), data.length - 1) : data.length - 1;
          if (
            !match ||
            (!match[1] && !Number(match[2])) ||
            !Number.isSafeInteger(start) ||
            !Number.isSafeInteger(end) ||
            start > end ||
            start >= data.length
          ) {
            response.writeHead(416, {
              ...headers,
              'Content-Range': `bytes */${data.length}`,
              'Content-Length': 0,
            });
            response.end();
            return;
          }
          headers['Content-Range'] = `bytes ${start}-${end}/${data.length}`;
          data = data.subarray(start, end + 1);
          status = 206;
        }
      }
      headers['Content-Length'] = data.length;
      response.writeHead(status, headers);
      response.end(request.method === 'HEAD' ? undefined : data);
    } catch (error) {
      response.writeHead(error instanceof URIError ? 400 : 404);
      response.end(error instanceof URIError ? 'Bad request' : 'Not found');
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8642);
  const server = createPreviewServer();
  server.on('error', (error) => {
    console.error(`Unable to start preview: ${error.message}`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () =>
    console.log(`Wedding invitation: http://127.0.0.1:${port}`),
  );
}
