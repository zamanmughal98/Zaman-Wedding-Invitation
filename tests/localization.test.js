import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { translateGuestText as t, languageFrom } from '../src/localization.js';
import { urduPhotos } from '../config/urdu-photos.js';
import { googleBackend } from './helpers/google-apps-script.mjs';

test('authored Urdu handles dates, errors and upload templates without altering filenames', () => {
  assert.equal(languageFrom('ur'), 'ur');
  for (const value of ['en', 'ar', '<script>', null]) assert.equal(languageFrom(value), 'en');
  assert.equal(t(' Invitation ', 'ur'), ' دعوت نامہ ');
  assert.equal(t('Invitation', 'en'), 'Invitation');
  assert.match(t('Sunday, 15 November 2026 · 7:00 PM', 'ur'), /اتوار.*نومبر.*شام/);
  assert.equal(t('7:00 pm', 'ur'), '7:00 شام');
  assert.equal(t('Today: Nikah & Barat', 'ur', urduPhotos), 'آج: نکاح و بارات');
  assert.doesNotMatch(
    t('The connection took too long. Please retry. Your wish is still in the form.', 'ur'),
    /[A-Za-z]/,
  );
  assert.equal(
    t('Preparing My_File.MOV · 53%', 'ur', urduPhotos),
    'فائل تیار ہو رہی ہے: My_File.MOV · 53٪',
  );
  assert.equal(
    t('Choose up to 20 files at a time.', 'ur', urduPhotos),
    'ایک بار میں 20 تک فائلیں منتخب کریں۔',
  );
  assert.equal(t('Private unrecognised original text', 'ur'), 'Private unrecognised original text');
});

test('Urdu query applies only to guests; moderation continues to use its original page configuration', () => {
  const b = googleBackend();
  assert.equal(
    JSON.parse(b.api.doGet({ parameter: { lang: 'ur' } }).page.pageConfig).language,
    'ur',
  );
  assert.equal(
    b.api.doGet({ parameter: { view: 'admin', lang: 'ur' } }).page.pageConfig,
    '{"admin":true,"maxLength":500}',
  );
});

test('standalone guest bundles contain valid JavaScript and match the authored translation source', async () => {
  for (const service of ['google-wishes', 'google-photos']) {
    const html = await readFile(
      new URL('../backend/' + service + '/GuestLocale.html', import.meta.url),
      'utf8',
    );
    const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
    new vm.Script(js);
    assert.ok(html.includes('دعوت نامہ'));
    assert.ok(!html.includes('fake-key-local-test-only'));
  }
});
