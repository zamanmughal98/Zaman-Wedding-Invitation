import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding } from '../config/wedding.js';
import { renderInvitation } from '../src/render.js';
import { photoUploadUrl } from '../src/photo-upload-service.js';

test('the invitation links to the separate public photo uploader without exposing storage details', () => {
  const url = photoUploadUrl(wedding);
  assert.ok(url.endsWith('/exec'));
  const html = renderInvitation(wedding);
  assert.ok(html.includes('href="' + url + '" target="_blank" rel="noopener noreferrer"'));
  assert.match(html, /Viewing is by invitation/);
  assert.doesNotMatch(
    html,
    /Photo sharing will open here soon|id="rsvp"|PHOTO_FOLDER_ID|PHOTO_LEDGER_ID/,
  );
  assert.notEqual(url, wedding.wishes.googleScriptUrl);
});

test('unconfigured photo sharing shows its fallback and can be hidden through section configuration', () => {
  const content = structuredClone(wedding);
  content.photos.googleScriptUrl = '';
  assert.match(renderInvitation(content), /Photo sharing will open here soon/);
  content.sections.find((section) => section.id === 'photo-uploads').enabled = false;
  assert.doesNotMatch(renderInvitation(content), /id="photo-uploads"|href="#photo-uploads"/);
});

test('photo configuration rejects non-Google addresses and private query or fragment data', () => {
  const content = structuredClone(wedding);
  for (const invalid of [
    'https://evil.example/exec',
    'javascript:alert(1)',
    wedding.photos.googleScriptUrl + '#key=secret',
    wedding.photos.googleScriptUrl + '?folder=private',
  ]) {
    content.photos.googleScriptUrl = invalid;
    assert.throws(() => photoUploadUrl(content));
  }
});
