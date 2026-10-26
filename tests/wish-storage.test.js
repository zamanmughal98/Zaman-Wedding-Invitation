import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { googleBackend, clone, wishInput } from './helpers/google-apps-script.mjs';

function fixture(count = 8) {
  const backend = googleBackend();
  for (let index = 0; index < count; index++) {
    const date = new Date(Date.UTC(2026, 9, index + 1)).toISOString();
    backend.rows.push([
      randomUUID(), randomUUID(), date, JSON.stringify('Guest ' + index),
      JSON.stringify('A warm wish ' + index), 'approved', 1, date, 'sent',
    ]);
  }
  return backend;
}

test('plaintext Sheet edits remain readable while pending and cleared rows stay private', () => {
  const b = fixture();
  b.rows[1][3] = 'Nimra Shafiq';
  b.rows[1][4] = 'An edited wish without JSON quotes.';
  const privateId = randomUUID();
  b.rows.push([privateId, randomUUID(), '2026-10-25T00:00:00.000Z', 'Pending name',
    'A private edited wish', 'pending', 1, '2026-10-25T00:00:00.000Z', 'sent']);
  b.rows.push(['', '', '', '', '', '', '', '', '']);
  b.rows.push([randomUUID(), '', '', '', '', 'approved', 1, '', '']);
  const first = clone(b.api.getPublicWishesPage('en', randomUUID(), { pinnedName: 'Nimra Shafiq' }));
  assert.equal(first.items.length, 6);
  assert.equal(first.items[0].name, 'Nimra Shafiq');
  assert.equal(first.items[0].message, 'An edited wish without JSON quotes.');
  assert.ok(!first.items.some((entry) => entry.id === privateId));
  assert.equal(b.api.getPublicWishes().length, 8);
  const privateEntry = clone(b.api.listModeration(b.key)).find((entry) => entry.id === privateId);
  assert.equal(privateEntry.message, 'A private edited wish');
  assert.equal(privateEntry.status, 'pending');
  assert.equal(b.rows[1][4], 'An edited wish without JSON quotes.');
});

test('JSON-encoded originals still round-trip and new writes remain formula safe', () => {
  const b = googleBackend();
  const name = '=IMPORTXML("https://example.test")';
  const message = 'Quoted "words" and a newline\nاللہ آپ کو خوش رکھے۔';
  b.api.submitWish(wishInput({ name, message }));
  const entry = b.api.listModeration(b.key)[0];
  b.api.moderateWish(b.key, entry.id, 'approve', entry.revision);
  assert.equal(b.rows[1][3], JSON.stringify(name));
  assert.equal(b.rows[1][4], JSON.stringify(message));
  const published = clone(b.api.getPublicWishesPage('en', randomUUID(), {})).items[0];
  assert.equal(published.name, name);
  assert.equal(published.message, message);
});

test('Date cells and ISO offsets produce canonical serializable pagination timestamps', () => {
  const b = fixture();
  for (const [index, row] of b.rows.slice(1).entries()) {
    row[2] = new Date(Date.UTC(2026, 9, index + 1));
    row[7] = new Date(Date.UTC(2026, 9, index + 1, 1));
  }
  b.rows[1][2] = '2026-10-01T05:00:00+05:00';
  const token = randomUUID();
  const first = b.api.getPublicWishesPage('en', token, {});
  assert.equal(typeof first.items[0].createdAt, 'string');
  assert.equal(first.items[0].createdAt, '2026-10-08T00:00:00.000Z');
  assert.equal(first.nextCursor.createdAt, '2026-10-03T00:00:00.000Z');
  const second = b.api.getPublicWishesPage('en', token, { cursor: first.nextCursor });
  assert.equal(second.items.length, 2);
  assert.equal(second.items[1].createdAt, '2026-10-01T00:00:00.000Z');
  assert.equal(b.api.listModeration(b.key)[0].updatedAt, '2026-10-08T01:00:00.000Z');
});

test('invalid timestamps remain undated but all approved wishes can still be paged', () => {
  const b = fixture(14);
  const invalid = ['not a date', '', 46000, new Date(NaN), '2026-02-30T00:00:00.000Z',
    '2026-10-25T25:00:00.000Z', '10/11/2026'];
  for (let index = 0; index < invalid.length; index++) b.rows[index + 1][2] = invalid[index];
  const ids = [];
  let cursor = null;
  do {
    const result = b.api.getPublicWishesPage('en', randomUUID(), { cursor });
    ids.push(...result.items.map((entry) => entry.id));
    cursor = result.nextCursor;
  } while (cursor);
  assert.equal(ids.length, 14);
  assert.equal(new Set(ids).size, 14);
  const entries = b.api.getPublicWishes();
  assert.equal(entries.filter((entry) => entry.createdAt === '').length, invalid.length);
  assert.equal(entries.at(-1).createdAt, '');
});

test('an unavailable reaction store does not hide wishes or expose private failure details', () => {
  const b = fixture();
  const privateHeaders = [['Private unrelated Sheet data']];
  b.tabs.set('WishReactions', {
    getLastRow: () => 1,
    getRange: () => ({ getValues: () => privateHeaders }),
  });
  const warnings = [];
  b.api.console = { warn: (message) => warnings.push(message) };
  for (const language of ['en', 'ur']) {
    const result = b.api.getPublicWishesPage(language, randomUUID(), {});
    assert.equal(result.items.length, 6);
    assert.ok(result.items.every((entry) => !Object.hasOwn(entry, 'reactions')));
    assert.ok(result.items.every((entry) => typeof entry.sourceVersions.en === 'string'));
    assert.ok(!JSON.stringify(result).includes('Private unrelated'));
  }
  assert.equal(warnings.length, 2);
  assert.ok(warnings.every((message) => message === warnings[0]));
  assert.ok(!warnings[0].includes('Private unrelated'));
  assert.throws(() => b.api.setPublicWishReaction(b.rows[1][0], randomUUID(), 'love'), /store/);
  assert.deepEqual(privateHeaders, [['Private unrelated Sheet data']]);
});

test('missing optional reaction functions do not break initial reads or later cursors', () => {
  const b = fixture();
  b.api.getPublicReactionState_ = undefined;
  b.api.wishReactionUuid_ = undefined;
  b.api.console = { warn() {} };
  const first = b.api.getPublicWishesPage('en', randomUUID(), {});
  const second = b.api.getPublicWishesPage('en', randomUUID(), { cursor: first.nextCursor });
  assert.equal(first.items.length + second.items.length, 8);
  assert.ok(first.items.every((entry) => !Object.hasOwn(entry, 'reactions')));
});

test('a missing translation helper never hides original approved wishes', () => {
  const b = fixture();
  const original = 'اللہ آپ دونوں کو خوش رکھے۔';
  b.rows[1][4] = JSON.stringify(original);
  b.api.wishSourceVersion_ = undefined;
  b.api.wishTranslations_ = undefined;
  const warnings = [];
  b.api.console = { warn: (message) => warnings.push(message) };
  for (const language of ['en', 'ur']) {
    const result = clone(b.api.getPublicWishesPage(language, randomUUID(), {}));
    assert.equal(result.items.length, 6);
    for (const entry of result.items) {
      assert.deepEqual(entry.sourceVersions, {});
      assert.deepEqual(entry.translations, { en: '', ur: '' });
      assert.equal(entry.sourceVersion, '');
      assert.equal(entry.translation, '');
      assert.ok(entry.reactions);
    }
    const finalPage = clone(b.api.getPublicWishesPage(language, randomUUID(), { cursor: result.nextCursor }));
    assert.equal(finalPage.items.length, 2);
    const native = finalPage.items.find((entry) => entry.message === original);
    assert.equal(native.translations.ur, original);
  }
  assert.equal(b.api.getPublicWishes().length, 8);
  assert.equal(b.translationRequests.length, 0);
  assert.equal(warnings.length, 4);
  assert.ok(warnings.every((message) => message === warnings[0]));
});
