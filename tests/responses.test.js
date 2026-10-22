import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding } from '../config/wedding.js';
import { emailAppUrl, whatsappUrl } from '../src/submissions.js';

const response = {
  name: 'A guest & family',
  message: 'A dua with + signs & love.',
};

test('wish handoffs preserve names, messages, punctuation, and contact destinations', () => {
  const email = new URL(emailAppUrl(wedding, response));
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'zamanbinishfaq+wedding@gmail.com');
  const text = email.searchParams.get('body');
  assert.ok(text.includes(response.name));
  assert.doesNotMatch(text, /guests|Contact:|Celebrations:/);
  assert.ok(text.includes(response.message));
  const whatsapp = new URL(whatsappUrl(wedding, response));
  assert.equal(whatsapp.origin, 'https://wa.me');
  assert.equal(whatsapp.pathname, '/923490095926');
  assert.equal(whatsapp.searchParams.get('text'), text);
});

test('a wish shares only the provided name and wish, without attendance fields', () => {
  const url = new URL(
    emailAppUrl(wedding, { name: 'Guest', message: 'May Allah bless you both.' }),
  );
  assert.match(url.searchParams.get('subject'), /wedding wish/);
  assert.match(url.searchParams.get('body'), /May Allah bless/);
  assert.doesNotMatch(url.searchParams.get('body'), /guests|Contact:|Celebrations:/);
});

test('missing destinations disable the corresponding contact links', () => {
  const content = structuredClone(wedding);
  content.responses.email = '';
  content.responses.whatsappPhone = '';
  assert.equal(emailAppUrl(content, response), '');
  assert.equal(whatsappUrl(content, response), '');
});
