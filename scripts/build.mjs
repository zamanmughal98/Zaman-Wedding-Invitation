import { cp, lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareDocument } from '../src/document.js';
import { wedding } from '../config/wedding.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destination = path.join(root, 'dist');
const hasOffset = (value) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(value);
const validDay = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
for (const event of wedding.events) {
  if (!validDay(event.date || event.start?.slice(0, 10)))
    throw new Error('Invalid calendar date for ' + event.id);
  if (event.start && (!hasOffset(event.start) || !Number.isFinite(Date.parse(event.start))))
    throw new Error('Invalid start time for ' + event.id);
  if (
    event.end &&
    (!event.start ||
      !hasOffset(event.end) ||
      !Number.isFinite(Date.parse(event.end)) ||
      new Date(event.end) <= new Date(event.start))
  )
    throw new Error('Invalid end time for ' + event.id);
  if (!/^[a-z][a-z0-9-]*$/.test(event.id)) throw new Error('Invalid event id: ' + event.id);
}
if (!validDay(wedding.invitation.date) && !hasOffset(wedding.invitation.date))
  throw new Error('Invalid wedding date.');
if (
  !hasOffset(wedding.countdown.targetDate) ||
  !Number.isFinite(Date.parse(wedding.countdown.targetDate))
)
  throw new Error('The countdown needs a confirmed time and timezone.');
if (new Set(wedding.sections.map((s) => s.id)).size !== wedding.sections.length)
  throw new Error('Section ids must be unique.');
if (new Set(wedding.events.map((event) => event.id)).size !== wedding.events.length)
  throw new Error('Event ids must be unique.');
const wishes = JSON.parse(await readFile(path.join(root, 'data/wishes.json'), 'utf8'));
if (
  !Array.isArray(wishes) ||
  wishes.some((wish) => !wish || typeof wish.name !== 'string' || typeof wish.message !== 'string')
)
  throw new Error('data/wishes.json must contain approved name/message objects.');
// Verify the exact project output before replacing an earlier build.
if (path.dirname(destination) !== root || path.basename(destination) !== 'dist')
  throw new Error('Unexpected build destination.');
const existing = await lstat(destination).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
  return null;
});
if (existing?.isSymbolicLink()) throw new Error('dist/ must not be a symbolic link.');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
for (const entry of ['style.css', 'script.js', 'src', 'config', 'styles', 'assets', 'data'])
  await cp(path.join(root, entry), path.join(destination, entry), {
    recursive: true,
    filter: (file) => !file.endsWith('.md'),
  });
await writeFile(
  path.join(destination, 'index.html'),
  prepareDocument(await readFile(path.join(root, 'index.html'), 'utf8'), {
    siteUrl: process.env.SITE_URL || wedding.site.url,
  }),
);
await writeFile(path.join(destination, '.nojekyll'), '');
console.log('Built the personalised wedding invitation in dist/.');
