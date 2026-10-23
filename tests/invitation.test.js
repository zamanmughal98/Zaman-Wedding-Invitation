import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding } from '../config/wedding.js';
import { calendarFile, countdownParts, formatDate, formatTime, safeUrl } from '../src/utils.js';
import { renderInvitation } from '../src/render.js';
import { createPreviewServer } from '../server.js';

test('overseas visitors see the venue time, with an unambiguous countdown', () => {
  const timestamp = '2027-06-12T16:00:00+05:00';
  assert.equal(formatTime(timestamp, wedding.site), '4:00 pm');
  assert.equal(formatDate('2027-06-12T23:30:00Z', wedding.site), '13 June 2027');
  assert.deepEqual(countdownParts(timestamp, Date.parse('2027-06-11T09:58:57Z')), {
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 3,
  });
});

test('the countdown stops at zero after the ceremony', () => {
  assert.deepEqual(countdownParts(wedding.invitation.date, Date.parse('2028-01-01')), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
});

test('calendar downloads preserve the actual event time and safely fold Unicode', () => {
  const event = {
    ...wedding.events.find((event) => event.id === 'walima'),
    end: '2026-11-15T21:00:00+05:00',
    description: 'نکاح کی تقریب '.repeat(18) + '\nWith love; always, together',
    venue: 'A hall, with gardens',
    address: 'Street; 12',
  };
  const calendar = calendarFile(event, wedding);
  assert.match(calendar, /DTSTART:20261115T140000Z/);
  assert.match(calendar, /DTEND:20261115T160000Z/);
  assert.match(calendar.replace(/\r\n /g, ''), /With love\\; always\\, together/);
  assert.match(calendar, /LOCATION:A hall\\, with gardens\\, Street\\; 12/);
  for (const line of calendar.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
});

test('sections and their navigation can be removed through configuration', () => {
  const content = structuredClone(wedding);
  content.envelope.enabled = false;
  content.music.enabled = false;
  content.sections = content.sections.map((section) => ({
    ...section,
    enabled: !['gallery', 'rsvp', 'celebrations'].includes(section.id),
  }));
  const html = renderInvitation(content);
  assert.doesNotMatch(
    html,
    /id="gallery"|id="rsvp"|id="celebrations"|href="#gallery"|href="#rsvp"|href="#celebrations"|id="envelope-dialog"|data-toggle-music/,
  );
  assert.match(html, /id="couple"/);
});

test('editable text is escaped, and unsafe image or link protocols are rejected', () => {
  const content = structuredClone(wedding);
  content.couple.bride.name = '<img src=x onerror=alert(1)>';
  content.gallery.photos.push({ src: 'javascript:alert(1)', alt: 'Test image', caption: '' });
  const html = renderInvitation(content);
  assert.doesNotMatch(html, /<img src=x|src="javascript:/);
  assert.match(html, /&lt;img src=x/);
  assert.equal(safeUrl('//untrusted.example/image.jpg'), '');
  assert.equal(safeUrl('/\\untrusted.example'), '');
});

test('the preview serves rendered content and assets, and excludes project documents', async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(origin);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /id="hero-title"/);
    assert.match(html, /id="event-nikah-barat"/);
    assert.doesNotMatch(html, /<!-- invitation -->/);
    const module = await fetch(origin + '/config/wedding.js');
    assert.match(module.headers.get('content-type'), /javascript/);
    const head = await fetch(origin, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    for (const file of [
      '/.git/config',
      '/DOC-20260928-WA0014.pdf',
      '/server.js',
      '/backend/google-wishes/Code.gs',
      '/backend/google-wishes/Index.html',
      '/README.md',
      '/assets/photos/README.md',
      '/%ZZ',
    ]) {
      const result = await fetch(origin + file);
      assert.ok(result.status === 404 || result.status === 400, file);
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('local video supports seeking, suffix requests and range errors', async () => {
  const server = createPreviewServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/assets/video/wedding-opening.mp4`;
  try {
    const full = await fetch(url);
    const bytes = Buffer.from(await full.arrayBuffer());
    assert.equal(full.headers.get('content-type'), 'video/mp4');
    assert.equal(full.headers.get('accept-ranges'), 'bytes');
    for (const [range, start, end] of [
      ['bytes=0-31', 0, 31],
      ['bytes=-32', bytes.length - 32, bytes.length - 1],
      [`bytes=${bytes.length - 16}-`, bytes.length - 16, bytes.length - 1],
    ]) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 206);
      assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${bytes.length}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(start, end + 1));
    }
    const head = await fetch(url, { method: 'HEAD', headers: { Range: 'bytes=0-31' } });
    assert.equal(head.status, 206);
    assert.equal(head.headers.get('content-length'), '32');
    assert.equal(await head.text(), '');
    for (const range of ['bytes=999999999-', 'bytes=30-10', 'bytes=-0', 'bytes=oops']) {
      const response = await fetch(url, { headers: { Range: range } });
      assert.equal(response.status, 416);
      assert.equal(response.headers.get('content-range'), `bytes */${bytes.length}`);
      assert.equal(await response.text(), '');
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
