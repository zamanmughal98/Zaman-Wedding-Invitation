import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { googleBackend, clone } from './helpers/google-apps-script.mjs';
import { isWishResizeMessage } from '../src/features/wishes-embed.js';

function fixture(count) {
  const backend = googleBackend();
  for (let index = 0; index < count; index++) {
    const date = new Date(Date.UTC(2026, 9, 1) + index * 1000).toISOString();
    backend.rows.push([
      randomUUID(), randomUUID(), date, JSON.stringify('Guest ' + index),
      JSON.stringify('A warm wish ' + index), 'approved', 1, date, 'sent',
    ]);
  }
  return backend;
}
const page = (backend, options = {}, token) =>
  clone(backend.api.getPublicWishesPage('en', token, options));

test('47 approved wishes arrive in separate batches without duplicates or private records', () => {
  const b = fixture(49);
  b.rows[1][5] = 'pending';
  b.rows[2][5] = 'hidden';
  const seen = [];
  let cursor = null;
  do {
    const result = page(b, { cursor });
    assert.ok(result.items.length <= 6);
    assert.equal(result.hasMore, Boolean(result.nextCursor));
    seen.push(...result.items.map((entry) => entry.id));
    cursor = result.nextCursor;
  } while (cursor);
  assert.equal(seen.length, 47);
  assert.equal(new Set(seen).size, 47);
  assert.deepEqual(seen, b.rows.slice(3).reverse().map((row) => row[0]));
  assert.equal(b.translationRequests.length, 0);
});

test('only the newest exact-name approved match is pinned, even outside the old 200-wish range', () => {
  const b = fixture(207);
  b.rows[1][3] = JSON.stringify('Nimra Shafiq');
  b.rows[3][3] = JSON.stringify('Nimra Shafiq');
  b.rows[207][3] = JSON.stringify('Nimra Shafiq family');
  const options = { pinnedName: 'Nimra Shafiq' };
  const first = page(b, options);
  assert.equal(first.items.length, 6);
  assert.equal(first.items[0].id, b.rows[3][0]);
  const all = [...first.items];
  let cursor = first.nextCursor;
  while (cursor) {
    const result = page(b, { ...options, cursor });
    all.push(...result.items);
    cursor = result.nextCursor;
  }
  assert.equal(all.length, 207);
  assert.equal(new Set(all.map((entry) => entry.id)).size, 207);
  b.rows[3][5] = 'hidden';
  assert.equal(page(b, options).items[0].id, b.rows[1][0]);
  assert.notEqual(page(b, { pinnedName: 'nimra shafiq' }).items[0].id, b.rows[1][0]);
});

test('cursor ordering remains stable across tied timestamps, hidden wishes and new approvals', () => {
  const b = fixture(20);
  for (const row of b.rows.slice(1)) row[2] = '2026-10-01T00:00:00.000Z';
  const ordered = page(b, { limit: 30 }).items.map((entry) => entry.id);
  const first = page(b);
  const removed = b.rows.find((row) => row[0] === ordered[0]);
  removed[5] = 'hidden';
  const newId = randomUUID();
  b.rows.push([newId, randomUUID(), '2026-10-02T00:00:00.000Z', '"New guest"',
    '"New wish"', 'approved', 1, '2026-10-02T00:00:00.000Z', 'sent']);
  const second = page(b, { cursor: first.nextCursor });
  assert.deepEqual(second.items.map((entry) => entry.id), ordered.slice(6, 12));
  assert.equal(page(b).items[0].id, newId);
});

test('refreshing an expanded wall returns only the requested range and current reactions', () => {
  const b = fixture(47);
  const token = randomUUID();
  const first = page(b, {}, token);
  const id = first.items[0].id;
  b.api.setPublicWishReaction(id, token, 'love');
  const expanded = page(b, { limit: 12 }, token);
  assert.equal(expanded.items.length, 12);
  assert.equal(expanded.items[0].reactions.selected, 'love');
  assert.equal(expanded.items[0].reactions.counts.love, 1);
  b.rows.find((row) => row[0] === id)[5] = 'hidden';
  const refreshed = page(b, { limit: 12 }, token);
  assert.equal(refreshed.items.length, 12);
  assert.ok(!refreshed.items.some((entry) => entry.id === id));
  const next = page(b, { cursor: refreshed.nextCursor }, token);
  const ids = new Set(refreshed.items.map((entry) => entry.id));
  assert.ok(next.items.every((entry) => !ids.has(entry.id)));
});

test('empty pages and malformed pagination requests are handled without writes', () => {
  const b = fixture(0);
  assert.deepEqual(page(b), { items: [], hasMore: false, nextCursor: null });
  for (const limit of [-1, 0, 1, 5, 6.5, '6', 10001])
    assert.throws(() => page(b, { limit }), /reload/);
  for (const cursor of ['invalid', {}, { id: randomUUID(), createdAt: 'invalid' }])
    assert.throws(() => page(b, { cursor }), /reload/);
  assert.equal(b.tabs.has('WishReactions'), false);
});

test('embed configuration is public-only and validates its resize channel and origin', () => {
  const b = fixture(0);
  const parameter = { embedChannel: randomUUID(), parentOrigin: 'https://example.test', lang: 'ur' };
  const config = JSON.parse(b.api.doGet({ parameter }).page.pageConfig);
  assert.deepEqual(config.embed, { channel: parameter.embedChannel, parentOrigin: parameter.parentOrigin });
  assert.equal(config.language, 'ur');
  assert.equal(JSON.parse(b.api.doGet({ parameter: { ...parameter, parentOrigin: '*' } }).page.pageConfig).embed, undefined);
  assert.equal(b.api.doGet({ parameter: { ...parameter, view: 'admin' } }).page.pageConfig,
    '{"admin":true,"maxLength":500}');
});

test('only matching, bounded resize messages from the service can resize the guestbook', () => {
  const channel = randomUUID();
  const event = { origin: 'https://example-script.googleusercontent.com', source: {},
    data: { type: 'wedding:wishes:resize', channel, height: 3000, viewportHeight: 900, viewportWidth: 390 } };
  const valid = (value) => isWishResizeMessage(value, channel, 'https://script.google.com');
  assert.equal(valid(event), true);
  for (const origin of ['null', 'https://evil.test', 'https://fakegoogleusercontent.com', 'https://script.google.com.evil.test'])
    assert.equal(valid({ ...event, origin }), false);
  for (const height of [NaN, Infinity, '3000', -1, 0, 10000001])
    assert.equal(valid({ ...event, data: { ...event.data, height } }), false);
  for (const viewportHeight of [undefined, NaN, '900', 0])
    assert.equal(valid({ ...event, data: { ...event.data, viewportHeight } }), false);
  assert.equal(valid({ ...event, source: null }), false);
  assert.equal(valid({ ...event, data: { ...event.data, channel: randomUUID() } }), false);
  assert.equal(valid({ ...event, data: { ...event.data, type: 'something-else' } }), false);
});
