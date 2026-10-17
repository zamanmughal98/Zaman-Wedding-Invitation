import test from 'node:test';
import assert from 'node:assert/strict';
import { wedding } from '../config/wedding.js';
import { calendarFile, formatDate } from '../src/utils.js';
import { renderInvitation } from '../src/render.js';

test('date-only evenings preserve their date without inventing a time', () => {
  const evening = wedding.events.find((event) => event.id === 'bride-mehndi');
  assert.equal(
    formatDate(evening.date, { ...wedding.site, timeZone: 'America/Los_Angeles' }),
    '12 November 2026',
  );
  const calendar = calendarFile(evening, wedding);
  assert.match(calendar, /DTSTART;VALUE=DATE:20261112/);
  assert.match(calendar, /DTEND;VALUE=DATE:20261113/);
  assert.doesNotMatch(calendar, /DTSTART:\d{8}T/);
  assert.match(calendar.replace(/\r\n /g, ''), /Time to follow/);
});

test('the printed Walima start is used without fabricating an end time', () => {
  const reception = wedding.events.find((event) => event.id === 'walima');
  assert.match(calendarFile(reception, wedding), /DTSTART:20261115T140000Z/);
  assert.doesNotMatch(calendarFile(reception, wedding), /DTEND/);
  assert.equal(wedding.countdown.targetDate, reception.start);
});

test('the invitation renders confirmed names and four functions, without a false response deadline', () => {
  const html = renderInvitation(wedding);
  for (const name of ['Zaman Mughal', 'Nimra Shafiq', 'Royal Vista Event Complex'])
    assert.ok(html.includes(name));
  for (const event of wedding.events) assert.ok(html.includes('id="event-' + event.id + '"'));
  assert.doesNotMatch(html, /1970|2027|Sample Guest|id="story"/);
  assert.doesNotMatch(html, /Kindly respond by/);
});

test('a supplied animation stays within the GitHub project and supports a pause control', () => {
  const content = structuredClone(wedding);
  content.invitation.heroVideo = '/assets/videos/couple.mp4';
  content.invitation.heroVideoPoster = '/assets/photos/poster.webp';
  const html = renderInvitation(content);
  assert.match(html, /src="\.\/assets\/videos\/couple.mp4"/);
  assert.match(html, /poster="\.\/assets\/photos\/poster.webp"/);
  assert.match(html, /muted loop playsinline/);
  assert.match(html, /data-toggle-video/);
  assert.doesNotMatch(renderInvitation(wedding), /<video/);
});
