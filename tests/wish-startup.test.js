import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { googleBackend, clone } from './helpers/google-apps-script.mjs';

function fixture() {
  const b = googleBackend({ initialProperties: { WISH_TRANSLATION_MODEL: 'gemini-test-model' } });
  for (let index = 0; index < 10; index++) {
    const date = new Date(Date.UTC(2026, 9, index + 1)).toISOString();
    b.rows.push([randomUUID(), randomUUID(), date,
      JSON.stringify(index === 0 ? 'Nimra Shafiq' : 'Guest ' + index),
      JSON.stringify('A warm wish ' + index), index === 9 ? 'pending' : 'approved', 1, date, 'sent']);
  }
  return b;
}
const page = (b, token) => clone(b.api.getPublicWishesPage('en', token, { pinnedName: 'Nimra Shafiq' }));

test('public and private documents never wait for settings, Sheets or a wishes read', () => {
  const b = fixture();
  const opens = b.calls.opened.length;
  const unavailable = () => { throw Error('Storage access must not delay the document'); };
  b.api.PropertiesService.getScriptProperties = unavailable;
  b.api.SpreadsheetApp.openById = unavailable;
  b.api.getPublicWishesPage = unavailable;
  b.api.records_ = unavailable;
  for (const language of ['en', 'ur']) {
    const config = JSON.parse(b.api.doGet({ parameter: { lang: language } }).page.pageConfig);
    assert.equal(config.language, language);
    assert.equal(config.pinnedWishName, 'Nimra Shafiq');
    assert.equal(config.initialPage, undefined);
  }
  assert.equal(b.api.doGet({ parameter: { view: 'admin' } }).page.pageConfig,
    '{"admin":true,"maxLength":500}');
  assert.equal(b.calls.opened.length, opens);
  assert.equal(b.emails.length, 0);
  assert.equal(b.translationRequests.length, 0);
});

test('the first RPC reads six approved wishes with the pinned bride, cached translations and selected reactions', () => {
  const b = fixture();
  const id = b.rows[1][0], original = 'A warm wish 0';
  const urdu = 'اللہ آپ دونوں کو خوش رکھے۔';
  const version = b.api.wishSourceVersion_(original, 'ur');
  b.api.writeWishTranslation_(id, { version, state: 'ready', text: urdu }, undefined, 'ur');
  const token = randomUUID();
  b.api.setPublicWishReaction(id, token, 'love');
  const rowsBefore = [...b.tabs.values()].map((sheet) => sheet.rows.length);
  const result = page(b, token);
  assert.equal(result.items.length, 6);
  assert.equal(result.items[0].id, id);
  assert.equal(result.items[0].message, original);
  assert.equal(result.items[0].translations.ur, urdu);
  assert.equal(result.items[0].reactions.counts.love, 1);
  assert.equal(result.items[0].reactions.selected, 'love');
  assert.equal(result.hasMore, true);
  assert.ok(!result.items.some((entry) => entry.name === 'Guest 9'));
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes(b.tabs.get('WishReactions').rows[1][1]), 'no visitor digest is public');
  assert.ok(!serialized.includes(b.rows[1][1]), 'no request ID is public');
  assert.ok(!serialized.includes(b.key), 'no moderator key is public');
  assert.equal(b.emails.length, 0);
  assert.equal(b.translationRequests.length, 0, 'reading wishes never calls the translation provider');
  assert.deepEqual([...b.tabs.values()].map((sheet) => sheet.rows.length), rowsBefore);
});

test('each public data request opens the spreadsheet once for all wishes and metadata', () => {
  const b = fixture(), token = randomUUID();
  for (const read of [
    () => page(b, token),
    () => b.api.getPublicWishes('ur', token),
    () => b.api.getPublicWishes(),
  ]) {
    const opens = b.calls.opened.length;
    assert.ok(read());
    assert.equal(b.calls.opened.length - opens, 1);
  }
});

test('public RPCs read current moderation and direct Sheet edits without a shared cache', () => {
  const b = fixture(), id = b.rows[1][0];
  assert.equal(page(b).items[0].id, id);
  b.rows[1][4] = 'A direct edited message';
  assert.equal(page(b).items[0].message, 'A direct edited message');
  b.api.moderateWish(b.key, id, 'hide', 1);
  assert.ok(!page(b).items.some((entry) => entry.id === id));
  const pending = b.rows[10];
  b.api.moderateWish(b.key, pending[0], 'approve', 1);
  assert.equal(page(b).items[0].id, pending[0]);
});

test('document configuration contains neither guest messages nor private storage details', () => {
  const b = fixture();
  const message = '</script><script>private-guest-markup</script>';
  b.rows[1][4] = JSON.stringify(message);
  const raw = b.api.doGet({ parameter: {} }).page.pageConfig;
  assert.ok(!raw.includes('<'));
  assert.ok(!raw.includes('private-guest-markup'));
  assert.ok(!raw.includes(b.key));
  assert.ok(!raw.includes(b.properties.get('SHEET_ID')));
  assert.equal(page(b).items[0].message, message, 'the separate public read preserves the exact original');
});
