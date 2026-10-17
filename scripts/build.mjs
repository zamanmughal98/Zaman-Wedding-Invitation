import { cp, lstat, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDocument } from '../src/document.js';
import { wedding } from '../config/wedding.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'dist');
const hasOffset = (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(value);
for (const event of wedding.events) {
  if (
    !hasOffset(event.start) ||
    !hasOffset(event.end) ||
    !Number.isFinite(new Date(event.start).getTime()) ||
    !Number.isFinite(new Date(event.end).getTime()) ||
    new Date(event.end) <= new Date(event.start)
  )
    throw new Error(
      `Invalid dates for ${event.id}. Include a UTC offset and an end after the start.`,
    );
  if (!/^[a-z][a-z0-9-]*$/.test(event.id)) throw new Error(`Invalid event id: ${event.id}`);
}
if (!hasOffset(wedding.invitation.date) || !Number.isFinite(new Date(wedding.invitation.date).getTime()))
  throw new Error('Invalid wedding date.');
if (new Set(wedding.sections.map((section) => section.id)).size !== wedding.sections.length)
  throw new Error('Section ids must be unique.');
if (new Set(wedding.events.map((event) => event.id)).size !== wedding.events.length)
  throw new Error('Event ids must be unique.');
// Verify the exact output directory before replacing an earlier build.
if (path.dirname(destination) !== root || path.basename(destination) !== 'dist')
  throw new Error('Unexpected build destination.');
const existing = await lstat(destination).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (existing?.isSymbolicLink()) throw new Error('dist/ must not be a symbolic link.');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const publicFiles = ['style.css', 'script.js', 'src', 'config', 'styles', 'assets'];
for (const entry of publicFiles)
  await cp(path.join(root, entry), path.join(destination, entry), {
    recursive: true,
    filter: (file) => !file.endsWith('.md'),
  });
await writeFile(
  path.join(destination, 'index.html'),
  prepareDocument(await readFile(path.join(root, 'index.html'), 'utf8')),
);
const photos = [
  wedding.invitation.heroPhoto,
  wedding.couple.bride.photo,
  wedding.couple.groom.photo,
  ...wedding.gallery.photos.map((photo) => photo.src),
].filter(Boolean);
for (const photo of photos) {
  if (photo.startsWith('/') && !photo.startsWith('//')) {
    try {
      await readFile(path.join(destination, photo));
    } catch {
      console.warn(
        `Photo is not present yet: ${photo}. The browser will show its illustrated fallback.`,
      );
    }
  }
}
const files = await readdir(destination);
console.log(
  `Built invitation in dist/ (${files.length} top-level entries). No installation needed.`,
);
