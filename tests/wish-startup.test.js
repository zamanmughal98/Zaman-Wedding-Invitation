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
function bootstrap(b, language = 'en') {
  return JSON.parse(b.api.doGet({ parameter: { lang: language } }).page.pageConfig);
}

test('the initial public document carries six approved wishes, the pinned bride and cached translations', () => {
  const b = fixture();
  const id = b.rows[1][0], original = 'A warm wish 0';
  const urdu = 'اللہ آپ دونوں کو خوش رکھے۔';
  const version = b.api.wishSourceVersion_(original, 'ur');
  b.api.writeWishTranslation_(id, { version, state: 'ready', text: urdu }, undefined, 'ur');
  const token = randomUUID();
  b.api.setPublicWishReaction(id, token, 'love');
  const rowsBefore = [...b.tabs.values()].map((sheet) => sheet.rows.length);
  const config = bootstrap(b, 'ur');
  assert.equal(config.pinnedWishName, 'Nimra Shafiq');
  assert.equal(config.initialPage.items.length, 6);
  assert.equal(config.initialPage.items[0].id, id);
  assert.equal(config.initialPage.items[0].message, original);
  assert.equal(config.initialPage.items[0].translations.ur, urdu);
  assert.equal(config.initialPage.items[0].reactions.counts.love, 1);
  assert.equal(config.initialPage.items[0].reactions.selected, '', 'HTML contains shared counts only');
  assert.equal(config.initialPage.hasMore, true);
  assert.ok(!config.initialPage.items.some((entry) => entry.name === 'Guest 9'));
  const serialized = JSON.stringify(config);
  assert.ok(!serialized.includes(b.tabs.get('WishReactions').rows[1][1]), 'no visitor digest is public');
  assert.ok(!serialized.includes(b.rows[1][1]), 'no request ID is public');
  assert.ok(!serialized.includes(b.key), 'no moderator key is public');
  assert.equal(b.emails.length, 0);
  assert.equal(b.translationRequests.length, 0, 'bootstrap never calls the translation provider');
  assert.deepEqual([...b.tabs.values()].map((sheet) => sheet.rows.length), rowsBefore);
});

test('each public page read opens the spreadsheet once while browser-specific reactions stay current', () => {
  const b = fixture(), token = randomUUID();
  b.api.setPublicWishReaction(b.rows[1][0], token, 'love');
  for (const read of [
    () => bootstrap(b),
    () => b.api.getPublicWishesPage('en', token, { pinnedName: 'Nimra Shafiq' }),
    () => b.api.getPublicWishes('ur', token),
    () => b.api.getPublicWishes(),
  ]) {
    const opens = b.calls.opened.length;
    const result = read();
    assert.equal(b.calls.opened.length - opens, 1);
    assert.ok(result);
  }
  const refreshed = clone(b.api.getPublicWishesPage('en', token, { pinnedName: 'Nimra Shafiq' }));
  assert.equal(refreshed.items[0].reactions.selected, 'love');
  assert.equal(refreshed.items[0].reactions.counts.love, 1);
});

test('initial documents always read current moderation and direct Sheet edits without a shared cache', () => {
  const b = fixture(), id = b.rows[1][0];
  assert.equal(bootstrap(b).initialPage.items[0].id, id);
  b.rows[1][4] = 'A direct edited message';
  assert.equal(bootstrap(b).initialPage.items[0].message, 'A direct edited message');
  b.api.moderateWish(b.key, id, 'hide', 1);
  assert.ok(!bootstrap(b).initialPage.items.some((entry) => entry.id === id));
  const pending = b.rows[10];
  b.api.moderateWish(b.key, pending[0], 'approve', 1);
  assert.equal(bootstrap(b).initialPage.items[0].id, pending[0]);
});

test('a temporary initial read failure leaves the public document and retry path available', () => {
  const b = fixture(), saved = b.api.getPublicWishesPage;
  b.api.console = { warn() {} };
  b.api.getPublicWishesPage = () => { throw Error('PRIVATE storage details'); };
  const config = bootstrap(b);
  assert.equal(config.language, 'en');
  assert.equal(config.initialPage, undefined);
  assert.ok(!JSON.stringify(config).includes('PRIVATE'));
  b.api.getPublicWishesPage = saved;
  assert.equal(bootstrap(b).initialPage.items.length, 6);
});

test('bootstrap safely serializes guest markup and never reads storage for a private dashboard document', () => {
  const b = fixture();
  b.rows[1][4] = JSON.stringify('</script><script>alert(1)</script>');
  const raw = b.api.doGet({ parameter: {} }).page.pageConfig;
  assert.ok(!raw.includes('<'));
  assert.equal(JSON.parse(raw).initialPage.items[0].message, '</script><script>alert(1)</script>');
  const opens = b.calls.opened.length;
  assert.equal(b.api.doGet({ parameter: { view: 'admin' } }).page.pageConfig,
    '{"admin":true,"maxLength":500}');
  assert.equal(b.calls.opened.length, opens);
});
