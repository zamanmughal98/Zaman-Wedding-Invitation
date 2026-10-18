import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding } from '../config/wedding.js';
import { emailAppUrl, whatsappUrl } from '../src/submissions.js';

const response = {
  name: 'A guest & family',
  attendance: 'yes',
  contact: 'guest@example.com',
  guests: 3,
  events: ['walima'],
  message: 'A dua with + signs & love.',
};

test('email and WhatsApp handoffs preserve the message and actual reception choice', () => {
  const email = new URL(emailAppUrl(wedding, 'rsvp', response));
  assert.equal(email.protocol, 'mailto:');
  assert.equal(email.pathname, 'zamanbinishfaq+wedding@gmail.com');
  const text = email.searchParams.get('body');
  assert.match(text, /3 guest/);
  assert.match(text, /Walima Reception/);
  assert.ok(text.includes(response.message));
  const whatsapp = new URL(whatsappUrl(wedding, 'rsvp', response));
  assert.equal(whatsapp.origin, 'https://wa.me');
  assert.equal(whatsapp.pathname, '/923490095926');
  assert.equal(whatsapp.searchParams.get('text'), text);
});

test('a wish shares only the provided name and wish, without attendance fields', () => {
  const url = new URL(
    emailAppUrl(wedding, 'wish', { name: 'Guest', message: 'May Allah bless you both.' }),
  );
  assert.match(url.searchParams.get('subject'), /wedding wish/);
  assert.match(url.searchParams.get('body'), /May Allah bless/);
  assert.doesNotMatch(url.searchParams.get('body'), /guests|Contact:|Celebrations:/);
});

test('missing destinations disable the corresponding contact links', () => {
  const content = structuredClone(wedding);
  content.responses.email = '';
  content.rsvp.contactPhone = '';
  assert.equal(emailAppUrl(content, 'rsvp', response), '');
  assert.equal(whatsappUrl(content, 'rsvp', response), '');
});
