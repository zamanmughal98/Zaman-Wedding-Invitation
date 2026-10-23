import test from 'node:test';
import assert from 'node:assert/strict';
import { googleBackend, clone, wishInput } from './helpers/google-apps-script.mjs';
import { wedding } from '../config/wedding.js';
import { wishesWidgetUrl } from '../src/wishes-service.js';
import { renderInvitation } from '../src/render.js';

test('new wishes remain private until approval; hiding or rejecting removes them', () => {
  const { api, key } = googleBackend();
  api.submitWish(wishInput({ status: 'approved' }));
  assert.deepEqual(clone(api.getPublicWishes()), []);
  let entry = api.listModeration(key)[0];
  assert.equal(entry.status, 'pending');
  api.moderateWish(key, entry.id, 'approve', entry.revision);
  assert.equal(api.getPublicWishes().length, 1);
  entry = api.listModeration(key)[0];
  api.moderateWish(key, entry.id, 'hide', entry.revision);
  assert.equal(api.getPublicWishes().length, 0);
  entry = api.listModeration(key)[0];
  api.moderateWish(key, entry.id, 'approve', entry.revision);
  entry = api.listModeration(key)[0];
  api.moderateWish(key, entry.id, 'reject', entry.revision);
  assert.equal(api.getPublicWishes().length, 0);
});

test('queue reads and every moderation change require the private key', () => {
  const { api, key } = googleBackend();
  api.submitWish(wishInput());
  const entry = api.listModeration(key)[0];
  for (const wrong of ['', 'b'.repeat(64), null]) {
    assert.throws(() => api.listModeration(wrong), /private moderation link/);
    assert.throws(() => api.moderateWish(wrong, entry.id, 'approve', 1), /private moderation link/);
  }
  assert.equal(api.getPublicWishes().length, 0);
  assert.throws(() => api.moderateWish(key, entry.id, 'delete', 1), /Choose Approve/);
});

test('retries save one wish and send one alert, and stale actions cannot overwrite a decision', () => {
  const { api, key, emails } = googleBackend();
  const input = wishInput();
  api.submitWish(input);
  api.submitWish(input);
  assert.equal(api.listModeration(key).length, 1);
  assert.equal(emails.length, 1);
  assert.throws(
    () => api.submitWish({ ...input, message: 'A different message' }),
    /reload the form/,
  );
  const entry = api.listModeration(key)[0];
  api.moderateWish(key, entry.id, 'approve', 1);
  assert.throws(() => api.moderateWish(key, entry.id, 'hide', 1), /has changed/);
  assert.equal(api.getPublicWishes().length, 1);
});

test('saved pending wishes survive an email failure or exhausted mail quota', () => {
  for (const quota of [0, 100]) {
    const backend = googleBackend({ quota });
    if (quota) backend.failEmail();
    assert.equal(backend.api.submitWish(wishInput()).accepted, true);
    assert.equal(backend.api.listModeration(backend.key)[0].notification, 'unavailable');
    assert.equal(backend.emails.length, 0);
    assert.equal(backend.api.getPublicWishes().length, 0);
  }
});

test('opening a moderation link is read-only and HTML contains no secret or pending content', () => {
  const { api, key, emails } = googleBackend();
  api.submitWish(wishInput({ message: 'Private pending message' }));
  const page = api.doGet({ parameter: { view: 'admin', action: 'approve', key } });
  assert.equal(page.frame, undefined);
  assert.equal(page.page.pageConfig, '{"admin":true,"maxLength":500}');
  assert.equal(api.getPublicWishes().length, 0);
  assert.equal(api.doGet({ parameter: { view: 'wall' } }).frame, 'ALLOWALL');
  assert.ok(emails[0].body.includes('#key=' + key));
  assert.ok(!JSON.stringify(api.getPublicWishes()).includes(key));
});

test('server validates lengths, bounds submissions, and stores text without Sheet formulas', () => {
  const { api, key, rows, properties } = googleBackend();
  for (const input of [
    wishInput({ name: ' ' }),
    wishInput({ message: 'x'.repeat(501) }),
    wishInput({ requestId: 'bad' }),
  ]) {
    assert.throws(() => api.submitWish(input));
  }
  const input = wishInput({
    name: '=IMPORTXML("https://invalid.example")',
    message: '<img src=x onerror=alert(1)>',
  });
  api.submitWish(input);
  assert.equal(rows[1][3][0], '"');
  assert.equal(rows[1][4][0], '"');
  const entry = api.listModeration(key)[0];
  api.moderateWish(key, entry.id, 'approve', 1);
  assert.equal(api.getPublicWishes()[0].name, input.name);
  assert.equal(api.getPublicWishes()[0].message, input.message);
  properties.set('DAILY_LIMIT', '1');
  assert.equal(api.submitWish(input).accepted, true);
  assert.throws(() => api.submitWish(wishInput()), /cannot accept more/);
});

test('the live widget uses only a public deployment URL and never the static JSON wall', () => {
  const content = structuredClone(wedding);
  content.wishes.googleScriptUrl = 'https://script.google.com/macros/s/EXAMPLE_PUBLIC_ID/exec';
  const html = renderInvitation(content);
  assert.match(html, /<iframe\b[^>]*class="wishes-widget"/);
  assert.match(html, /EXAMPLE_PUBLIC_ID\/exec\?view=wall/);
  assert.doesNotMatch(html, /data-wishes-list|id="wish-dialog"/);
  const fallback = structuredClone(wedding);
  fallback.wishes.googleScriptUrl = '';
  assert.equal(wishesWidgetUrl(fallback), '');
  for (const invalid of [
    'https://script.google.com.evil.example/macros/s/x/exec',
    'javascript:alert(1)',
    'https://script.google.com/macros/s/x/exec?key=private',
    'https://script.google.com/macros/s/x/exec#key=private',
  ]) {
    content.wishes.googleScriptUrl = invalid;
    assert.throws(() => wishesWidgetUrl(content), /without a private key/);
  }
});

test('setup uses the existing bound spreadsheet and preserves its other tabs and moderation data', () => {
  const backend = googleBackend({
    bound: true,
    initialTabs: { 'Family notes': [['Keep this text']] },
  });
  assert.equal(backend.calls.created, 0);
  assert.equal(backend.properties.get('SHEET_ID'), 'bound-sheet');
  assert.deepEqual(backend.calls.inserted, ['Wishes']);
  assert.deepEqual(backend.tabs.get('Family notes').rows, [['Keep this text']]);
  backend.api.submitWish(wishInput());
  const before = clone(backend.rows);
  const key = backend.properties.get('MODERATOR_KEY');
  backend.api.setup_();
  assert.deepEqual(clone(backend.rows), before);
  assert.equal(backend.properties.get('MODERATOR_KEY'), key);
  assert.equal(backend.calls.created, 0);
  assert.deepEqual(backend.calls.inserted, ['Wishes']);
});

test('an explicit Sheet ID overrides the bound spreadsheet choice and initializes an empty Wishes tab', () => {
  const backend = googleBackend({
    bound: true,
    initialProperties: { SHEET_ID: 'chosen-sheet' },
    initialTabs: { Wishes: [], Notes: [['Keep']] },
  });
  assert.equal(backend.calls.opened[0], 'chosen-sheet');
  assert.equal(backend.properties.get('SHEET_ID'), 'chosen-sheet');
  assert.equal(backend.rows.length, 1);
  assert.equal(backend.rows[0][0], 'ID');
  assert.deepEqual(backend.tabs.get('Notes').rows, [['Keep']]);
  assert.equal(backend.calls.created, 0);
});

test('setup refuses to change an existing Wishes tab with unrelated data', () => {
  const backend = googleBackend({
    bound: true,
    initialTabs: { Wishes: [['Existing family data']] },
    initialize: false,
  });
  assert.throws(() => backend.api.setup_(), /different columns/);
  assert.deepEqual(backend.rows, [['Existing family data']]);
  assert.equal(backend.properties.get('MODERATOR_KEY'), undefined);
  assert.equal(backend.calls.created, 0);
  assert.deepEqual(backend.calls.inserted, []);
});

test('visible editor commands initialize and email the link for an authorized account', () => {
  const backend = googleBackend({ initialize: false });
  backend.api.initializeWeddingWishes();
  assert.equal(backend.rows[0][0], 'ID');
  const key = backend.properties.get('MODERATOR_KEY');
  backend.api.emailModeratorLink();
  assert.equal(backend.emails.length, 1);
  assert.ok(backend.emails[0].body.includes('#key=' + key));
  backend.api.renewModeratorLink();
  assert.notEqual(backend.properties.get('MODERATOR_KEY'), key);
  assert.equal(backend.emails.length, 2);
});

test('notification activation replaces the old recipient and preserves existing wishes and keys', () => {
  const backend = googleBackend({
    bound: true,
    initialProperties: { OWNER_EMAIL: 'zamanbinishfaq+wedding@gmail.com', DAILY_LIMIT: '75' },
    initialTabs: { Notes: [['Keep this text']] },
  });
  backend.api.submitWish(wishInput());
  const entry = backend.api.listModeration(backend.key)[0];
  backend.api.moderateWish(backend.key, entry.id, 'approve', entry.revision);
  const before = clone(backend.rows);
  const key = backend.properties.get('MODERATOR_KEY');
  const sheetId = backend.properties.get('SHEET_ID');
  backend.emails.length = 0;

  backend.api.activateWishNotifications();

  assert.equal(backend.properties.get('OWNER_EMAIL'), 'zamandata98+wedding@gmail.com');
  assert.equal(backend.properties.get('MODERATOR_KEY'), key);
  assert.equal(backend.properties.get('SHEET_ID'), sheetId);
  assert.equal(backend.properties.get('DAILY_LIMIT'), '75');
  assert.deepEqual(clone(backend.rows), before);
  assert.deepEqual(backend.tabs.get('Notes').rows, [['Keep this text']]);
  assert.equal(backend.emails.length, 1);
  assert.ok(backend.emails[0].body.includes('#key=' + key));
  backend.api.submitWish(wishInput());
  assert.equal(backend.emails.length, 2);
  assert.ok(
    backend.emails.every(
      (mail) => mail.to === 'zamandata98+wedding@gmail.com' && !mail.cc && !mail.bcc,
    ),
  );
  assert.equal(backend.api.getPublicWishes().length, 1);
});

test('anonymous or different web-app visitors cannot use the visible editor commands', () => {
  for (const activeEmail of ['', 'someone-else@example.test']) {
    const backend = googleBackend({ activeEmail });
    const before = clone(backend.rows);
    const key = backend.properties.get('MODERATOR_KEY');
    for (const command of [
      'initializeWeddingWishes',
      'emailModeratorLink',
      'activateWishNotifications',
      'renewModeratorLink',
    ]) {
      assert.throws(() => backend.api[command](), /Apps Script editor/);
    }
    assert.deepEqual(clone(backend.rows), before);
    assert.equal(backend.properties.get('MODERATOR_KEY'), key);
    assert.equal(backend.emails.length, 0);
  }
});

test('missing account-email permission fails before editor commands create data or send email', () => {
  const backend = googleBackend({ initialize: false, identityUnavailable: true });
  assert.throws(() => backend.api.initializeWeddingWishes(), /updated manifest/);
  assert.equal(backend.tabs.has('Wishes'), false);
  assert.equal(backend.emails.length, 0);
});

test('moderator emails use the configured public URL when automatic lookup is empty or a development URL', () => {
  for (const serviceUrl of [null, 'https://script.google.com/macros/s/DEVELOPMENT_ONLY/dev']) {
    const backend = googleBackend({ serviceUrl });
    backend.api.emailModeratorLink();
    assert.ok(backend.emails[0].body.includes(wedding.wishes.googleScriptUrl + '?view=admin#key='));
    assert.ok(!backend.emails[0].body.includes('/dev?'));
  }
});

test('an explicit public deployment override is validated before emailing a private key', () => {
  const backend = googleBackend();
  const url = 'https://script.google.com/macros/s/ANOTHER_OWNED_DEPLOYMENT/exec';
  backend.properties.set('WEB_APP_URL', url);
  backend.api.emailModeratorLink();
  assert.ok(backend.emails[0].body.includes(url + '?view=admin#key='));
  backend.properties.set('WEB_APP_URL', 'https://untrusted.example/');
  assert.throws(() => backend.api.emailModeratorLink(), /Set WEB_APP_URL/);
  assert.equal(backend.emails.length, 1);
});
