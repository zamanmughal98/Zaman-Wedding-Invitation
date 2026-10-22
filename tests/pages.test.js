import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { wedding } from '../config/wedding.js';
import { assetUrl } from '../src/utils.js';
import { renderInvitation } from '../src/render.js';
import { prepareDocument } from '../src/document.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const template = await readFile(path.join(root, 'index.html'), 'utf8');

// Serve the unbuilt source exactly as a static host does. There is deliberately
// no Node-side rendering or asset rewriting to hide broken project-page URLs.
async function staticHost(prefix) {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (!pathname.startsWith(prefix)) throw new Error('Outside project');
      const relative = decodeURIComponent(pathname.slice(prefix.length)) || 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep)) throw new Error('Outside project');
      const bytes = await readFile(file);
      const type =
        {
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.html': 'text/html',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.json': 'application/json',
        }[path.extname(file)] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': type });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}${prefix}` };
}

for (const prefix of ['/', '/Zaman-Wedding-Invitation/']) {
  test(`the static invitation loads its styles, theme, image, and entire module graph at ${prefix}`, async () => {
    const { server, url } = await staticHost(prefix);
    const seen = new Set();
    async function load(reference, parent = url) {
      const asset = new URL(reference, parent);
      assert.ok(asset.href.startsWith(url), `Resource escaped the project: ${asset.href}`);
      if (seen.has(asset.href)) return;
      seen.add(asset.href);
      const response = await fetch(asset);
      assert.equal(response.status, 200, asset.href);
      const bytes = Buffer.from(await response.arrayBuffer());
      const source = bytes.toString('utf8');
      if (asset.pathname.endsWith('.js')) {
        assert.match(response.headers.get('content-type'), /javascript/);
        const imports = [
          ...source.matchAll(/\b(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g),
        ];
        for (const [, dependency] of imports)
          if (dependency.startsWith('.') || dependency.startsWith('/'))
            await load(dependency, asset);
      }
      if (asset.pathname.endsWith('.css')) {
        for (const [, dependency] of source.matchAll(/\burl\(['"]?([^'"\)]+)['"]?\)/g))
          if (!/^(https?:|data:|#)/.test(dependency)) await load(dependency, asset);
      }
    }
    try {
      const page = await fetch(url);
      const html = await page.text();
      for (const [, reference] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
        if (!reference.startsWith('#') && !/^https?:/.test(reference)) await load(reference);
      }
      await load(assetUrl(wedding.wishes.publishedFile));
      assert.ok([...seen].some((url) => url.endsWith('/data/wishes.json')));
      assert.ok([...seen].some((url) => url.endsWith('/styles/stationery.css')));
      assert.ok([...seen].some((url) => url.endsWith('/styles/theme.css')));
      assert.ok([...seen].some((url) => url.endsWith('/config/wedding.js')));
      assert.ok([...seen].some((url) => url.endsWith('/src/features/music.js')));
      assert.ok([...seen].some((url) => url.endsWith('/assets/images/ivory-envelope.png')));
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
}

test('configured photos and music stay inside the project without breaking absolute URLs', () => {
  const base = 'https://example.github.io/invitation/';
  for (const input of ['/assets/photos/couple.webp', './assets/music.mp3']) {
    assert.ok(new URL(assetUrl(input), base).pathname.startsWith('/invitation/assets/'));
  }
  assert.equal(
    assetUrl('https://images.example.com/couple.webp'),
    'https://images.example.com/couple.webp',
  );
  assert.equal(assetUrl('javascript:alert(1)'), '');
  assert.equal(assetUrl('//untrusted.example/photo.jpg'), '');
  const content = structuredClone(wedding);
  content.invitation.heroPhoto = '/assets/photos/hero.webp';
  content.couple.bride.photo = '/assets/photos/bride.webp';
  content.gallery.photos.push({
    src: '/assets/photos/gallery.webp',
    alt: 'Test image',
    caption: '',
  });
  const html = renderInvitation(content);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.match(html, /src="\.\/assets\/photos\/hero.webp"/);
  assert.match(html, /src="\.\/assets\/photos\/bride.webp"/);
  assert.match(html, /src="\.\/assets\/photos\/gallery.webp"/);
});

test('built share metadata uses the deployment URL, including a repository prefix', () => {
  for (const base of ['https://example.github.io/invitation', 'https://wedding.example.com/']) {
    const expected = base.endsWith('/') ? base : base + '/';
    const html = prepareDocument(template, { siteUrl: base });
    assert.ok(html.includes(`property="og:url" content="${expected}"`));
    assert.ok(html.includes(`content="${expected}assets/images/ivory-envelope.png"`));
    assert.match(html, /id="hero-title"/);
    assert.doesNotMatch(html, /<!-- invitation -->/);
  }
});
