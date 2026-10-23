import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { googleBackend, wishInput, clone } from './helpers/google-apps-script.mjs';

const english = 'May Allah keep you both happy always.';
const urdu = 'اللہ آپ دونوں کو ہمیشہ خوش رکھے۔';
function backend(options = {}) {
  return googleBackend({
    translationResponse: (_url, request) => ({
      code: 200,
      text: JSON.parse(request.payload).systemInstruction.parts[0].text.includes(
        'natural English translation',
      )
        ? english
        : urdu,
    }),
    ...options,
    initialProperties: {
      GEMINI_API_KEY: 'fake-key-local-test-only',
      WISH_TRANSLATION_MODEL: 'gemini-test-model',
      ...options.initialProperties,
    },
  });
}
function approve(b, message = 'Allah ap dono ko hamesha khush rakhe.') {
  b.api.submitWish(wishInput({ message }));
  const entry = b.api.listModeration(b.key)[0];
  b.api.moderateWish(b.key, entry.id, 'approve', entry.revision);
  return entry.id;
}
function view(b, language) {
  return b.api.getPublicWishes(language)[0];
}
function translate(b, language) {
  const entry = view(b, language);
  return b.api.translatePublicWish(entry.id, entry.sourceVersion, language);
}

test('both Urdu-script and Roman Urdu wishes can be translated into English', () => {
  for (const message of [urdu, 'Allah ap dono ko hamesha khush rakhe.']) {
    const b = backend();
    approve(b, message);
    const originalRows = clone(b.rows);
    assert.equal(view(b, 'en').translation, '');
    const result = translate(b, 'en');
    assert.equal(result.status, 'ready');
    assert.equal(result.translation, english);
    assert.equal(result.targetLanguage, 'en');
    assert.equal(view(b, 'en').translation, english);
    assert.equal(translate(b, 'en').translation, english);
    assert.equal(b.translationRequests.length, 1);
    assert.deepEqual(clone(b.rows), originalRows);
    assert.equal(b.api.listModeration(b.key)[0].message, message);
    const payload = JSON.parse(b.translationRequests[0].options.payload);
    assert.equal(payload.contents[0].parts[0].text, JSON.stringify(message));
    assert.ok(!JSON.stringify(payload).includes('A test guest'));
  }
});

test('English and Urdu translations stay in independent caches for the same wish', () => {
  const b = backend();
  approve(b);
  const originalRows = clone(b.rows);
  const ur = view(b, 'ur'),
    en = view(b, 'en');
  assert.notEqual(ur.sourceVersion, en.sourceVersion);
  assert.equal(translate(b, 'ur').translation, urdu);
  assert.equal(translate(b, 'en').translation, english);
  assert.equal(view(b, 'ur').translation, urdu);
  assert.equal(view(b, 'ur').urdu, urdu);
  assert.equal(view(b, 'en').translation, english);
  translate(b, 'en');
  translate(b, 'ur');
  assert.equal(b.translationRequests.length, 2);
  assert.deepEqual(clone(b.rows), originalRows);
  assert.equal(b.tabs.get('WishTranslations').rows[0][3], 'Urdu (JSON text)');
  assert.equal(b.tabs.get('WishTranslationsEnglish').rows[0][3], 'English (JSON text)');
  assert.equal(b.api.translatePublicWish(en.id, en.sourceVersion, 'ur').status, 'changed');
  assert.equal(b.translationRequests.length, 2);
});

test('an original-text edit invalidates both language versions without changing the approval revision', () => {
  const b = backend();
  approve(b);
  translate(b, 'ur');
  translate(b, 'en');
  const before = { ur: view(b, 'ur'), en: view(b, 'en') };
  b.rows[1][4] = JSON.stringify('Aap dono ka safar khushiyon se bhara rahe.');
  for (const language of ['en', 'ur']) {
    const current = view(b, language);
    assert.notEqual(current.sourceVersion, before[language].sourceVersion);
    assert.equal(current.translation, '');
    assert.equal(
      b.api.translatePublicWish(current.id, before[language].sourceVersion, language).status,
      'changed',
    );
    assert.equal(translate(b, language).status, 'ready');
  }
  assert.equal(b.translationRequests.length, 4);
  assert.equal(b.rows[1][6], 2);
});

test('already deployed Urdu fingerprints and clients keep using their existing cached translations', () => {
  const b = backend();
  approve(b);
  const entry = view(b, 'ur');
  const oldVersion = createHash('sha256')
    .update(JSON.stringify(['natural-urdu-v1', 'gemini-test-model', entry.message]))
    .digest('hex');
  assert.equal(entry.sourceVersion, oldVersion);
  const generated = b.api.translatePublicWish(entry.id, oldVersion);
  assert.equal(generated.translation, urdu);
  assert.equal(view(b, 'ur').urdu, urdu);
  assert.equal(b.api.translatePublicWish(entry.id, oldVersion).translation, urdu);
  assert.equal(b.translationRequests.length, 1);
  assert.equal(b.api.getPublicWishes()[0].id, undefined);
});

test('neither target can translate private wishes, arbitrary text or an unsupported language', () => {
  for (const target of ['en', 'ur']) {
    const b = backend();
    b.api.submitWish(wishInput());
    const pending = b.api.listModeration(b.key)[0];
    const version = b.api.wishSourceVersion_(pending.message, target);
    assert.equal(b.api.translatePublicWish(pending.id, version, target).status, 'unavailable');
    assert.equal(
      b.api.translatePublicWish('arbitrary text', version, target).status,
      'unavailable',
    );
    b.api.moderateWish(b.key, pending.id, 'approve', 1);
    assert.equal(translate(b, target).status, 'ready');
    for (const language of ['fr', '', null, '<script>'])
      assert.equal(b.api.translatePublicWish(pending.id, version, language).status, 'unavailable');
    b.api.moderateWish(b.key, pending.id, 'hide', 2);
    assert.equal(b.api.getPublicWishes(target).length, 0);
    assert.equal(b.api.translatePublicWish(pending.id, version, target).status, 'unavailable');
    assert.equal(b.translationRequests.length, 1);
  }
});

test('both target results are discarded when the wish changes or is hidden in flight', () => {
  for (const target of ['en', 'ur'])
    for (const change of ['edit', 'hide']) {
      let b;
      b = backend({
        translationResponse: () => {
          if (change === 'edit') b.rows[1][4] = JSON.stringify('An edited message');
          else b.api.moderateWish(b.key, b.rows[1][0], 'hide', 2);
          return { code: 200, text: target === 'en' ? english : urdu };
        },
      });
      approve(b);
      assert.equal(translate(b, target).status, change === 'edit' ? 'changed' : 'unavailable');
      assert.ok(
        !JSON.stringify(b.api.getPublicWishes(target)).includes(target === 'en' ? english : urdu),
      );
    }
});

test('concurrent visitors share one reservation per target language', () => {
  for (const target of ['en', 'ur']) {
    let b;
    b = backend({
      translationResponse: () => {
        assert.equal(translate(b, target).status, 'original');
        return { code: 200, text: target === 'en' ? english : urdu };
      },
    });
    approve(b);
    assert.equal(translate(b, target).status, 'ready');
    assert.equal(translate(b, target).translation, target === 'en' ? english : urdu);
    assert.equal(b.translationRequests.length, 1);
  }
});

test('provider errors preserve originals, use a cooldown and keep provider details private', () => {
  for (const target of ['en', 'ur']) {
    const b = backend({
      translationResponse: () => ({ code: 429, body: 'private provider details' }),
    });
    approve(b);
    const original = b.api.getPublicWishes()[0].message;
    for (let i = 0; i < 3; i++) {
      const result = translate(b, target);
      assert.equal(result.status, 'original');
      assert.ok(!JSON.stringify(result).includes('private provider'));
    }
    assert.equal(b.translationRequests.length, 1);
    assert.equal(view(b, target).message, original);
  }
});

test('missing private configuration keeps originals readable without calling the provider', () => {
  for (const target of ['en', 'ur'])
    for (const property of ['GEMINI_API_KEY', 'WISH_TRANSLATION_MODEL']) {
      const b = backend({ initialProperties: { [property]: '' } });
      approve(b);
      const original = b.api.getPublicWishes()[0].message;
      assert.equal(translate(b, target).status, 'original');
      assert.equal(view(b, target).message, original);
      assert.equal(b.translationRequests.length, 0);
    }
});

test('both language stores save generated text without turning it into a Sheet formula', () => {
  for (const target of ['en', 'ur']) {
    const b = backend({
      translationResponse: () => ({ code: 200, text: '= ' + (target === 'en' ? english : urdu) }),
    });
    approve(b);
    assert.equal(translate(b, target).status, 'ready');
    const name = target === 'en' ? 'WishTranslationsEnglish' : 'WishTranslations';
    assert.equal(b.tabs.get(name).rows[1][3][0], '"');
  }
});

test('English failures preserve the original and never overwrite a working Urdu translation', () => {
  const b = backend({
    translationResponse: (_url, request) => ({
      code: 200,
      text: JSON.parse(request.payload).systemInstruction.parts[0].text.includes(
        'natural English translation',
      )
        ? 'یہ انگریزی ترجمہ نہیں ہے۔'
        : urdu,
    }),
  });
  approve(b);
  translate(b, 'ur');
  assert.equal(translate(b, 'en').status, 'original');
  assert.equal(translate(b, 'en').status, 'original');
  assert.equal(view(b, 'en').translation, '');
  assert.equal(view(b, 'ur').translation, urdu);
  assert.equal(b.translationRequests.length, 2);
});

test('the existing daily API cap is shared across both target languages', () => {
  const b = backend({ initialProperties: { WISH_TRANSLATION_DAILY_LIMIT: '1' } });
  approve(b);
  assert.equal(translate(b, 'en').status, 'ready');
  assert.equal(translate(b, 'ur').status, 'original');
  assert.equal(translate(b, 'en').translation, english);
  assert.equal(b.translationRequests.length, 1);
});

test('English originals echoed by the translator are cached without rewriting the source', () => {
  const b = backend({
    translationResponse: (_url, request) => ({
      code: 200,
      text: JSON.parse(JSON.parse(request.payload).contents[0].parts[0].text),
    }),
  });
  approve(b, english);
  assert.equal(translate(b, 'en').translation, english);
  assert.equal(translate(b, 'en').translation, english);
  assert.equal(b.api.getPublicWishes()[0].message, english);
  assert.equal(b.translationRequests.length, 1);
});

test('each public view provides both target versions and caches independently of the page language', () => {
  const b = backend();
  approve(b, english);
  const en = view(b, 'en');
  const ur = view(b, 'ur');
  assert.deepEqual(clone(en.sourceVersions), clone(ur.sourceVersions));
  assert.equal(en.sourceVersions.en, en.sourceVersion);
  assert.equal(en.sourceVersions.ur, ur.sourceVersion);
  assert.equal(b.translationRequests.length, 0);
  assert.equal(b.api.translatePublicWish(en.id, en.sourceVersions.ur, 'ur').translation, urdu);
  assert.equal(view(b, 'en').translations.ur, urdu);
  assert.equal(view(b, 'en').translations.en, '');
  translate(b, 'en');
  assert.equal(view(b, 'ur').translations.en, english);
  assert.equal(b.translationRequests.length, 2);
});

test('an Urdu original is immediately available as Urdu and still exposes an English choice', () => {
  const b = backend();
  approve(b, urdu);
  const entry = view(b, 'ur');
  assert.equal(entry.translations.ur, urdu);
  assert.equal(entry.translations.en, '');
  assert.equal(b.translationRequests.length, 0);
  assert.equal(
    b.api.translatePublicWish(entry.id, entry.sourceVersions.ur, 'ur').status,
    'original',
  );
  assert.equal(b.translationRequests.length, 0);
  assert.equal(
    b.api.translatePublicWish(entry.id, entry.sourceVersions.en, 'en').translation,
    english,
  );
  assert.equal(view(b, 'ur').translations.en, english);
  b.rows[1][4] = JSON.stringify('A different English original');
  assert.deepEqual(clone(view(b, 'en').translations), { en: '', ur: '' });
  assert.notEqual(view(b, 'en').sourceVersions.en, entry.sourceVersions.en);
  assert.notEqual(view(b, 'en').sourceVersions.ur, entry.sourceVersions.ur);
});
