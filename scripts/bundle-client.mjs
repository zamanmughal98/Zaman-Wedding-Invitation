import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

export async function bundleClient(destination) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: { app: 'script.js', styles: 'styles/site.css' },
    outdir: path.join(destination, 'build'),
    entryNames: '[name]-[hash]',
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: '[name]-[hash]',
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    charset: 'utf8',
    loader: { '.svg': 'file' },
    metafile: true,
  });
  const entries = {};
  for (const [file, info] of Object.entries(result.metafile.outputs)) {
    if (!info.entryPoint) continue;
    entries[info.entryPoint] = './' + path.relative(destination, path.resolve(root, file)).split(path.sep).join('/');
  }
  return { entries, metafile: result.metafile };
}

export function bundledDocument(html, entries) {
  return html
    .replace('href="./style.css"', `href="${entries['styles/site.css']}"`)
    .replace(/\s*<link rel="stylesheet" href="\.\/styles\/(stationery|language)\.css"\s*\/>/g, '')
    .replace('src="./script.js"', `src="${entries['script.js']}"`);
}
