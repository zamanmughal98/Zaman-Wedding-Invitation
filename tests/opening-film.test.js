import test from 'node:test';
import assert from 'node:assert/strict';
import { initEnvelope } from '../src/features/invitation.js';

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** Model actual media events and controllable time, including unresolved play attempts. */
function fixture(t, { connection, reduced = false, mobile = true, hash = '', navigation = 'navigate' } = {}) {
  let now = 0, nextTimer = 0;
  const timers = new Map();
  const doc = new EventTarget();
  doc.hidden = false;
  class Element extends EventTarget {
    constructor() {
      super();
      this.attributes = new Map();
      this.classes = new Set();
      this.classList = {
        add: (...values) => values.forEach((value) => this.classes.add(value)),
        remove: (...values) => values.forEach((value) => this.classes.delete(value)),
        contains: (value) => this.classes.has(value),
        toggle: (value, force = !this.classes.has(value)) => {
          if (force) this.classes.add(value); else this.classes.delete(value);
          return force;
        },
      };
      this.style = { setProperty() {} };
      this.disabled = false;
      this.hidden = false;
      this.inert = false;
      this.textContent = '';
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    focus() { doc.activeElement = this; }
  }
  class Video extends Element {
    constructor() {
      super();
      this.dataset = { src: '/original.mp4', lightSrc: '/light.mp4', poster: '/poster.webp' };
      this.paused = true;
      this.ended = false;
      this.error = null;
      this.currentTime = 0;
      this.duration = 10;
      this.playCalls = 0;
      this.loadCalls = 0;
      this.playResults = [];
    }
    set src(value) { this.setAttribute('src', value); }
    get src() { return this.getAttribute('src') || ''; }
    load() {
      this.loadCalls++;
      this.error = null;
      this.paused = true;
      this.ended = false;
      this.currentTime = 0;
    }
    play() {
      this.playCalls++;
      this.paused = false;
      this.dispatchEvent(new Event('play'));
      if (this.playResults.length) return this.playResults.shift()();
      this.dispatchEvent(new Event('playing'));
      return Promise.resolve();
    }
    pause() {
      if (this.paused) return;
      this.paused = true;
      this.dispatchEvent(new Event('pause'));
    }
  }
  const dialog = new Element();
  dialog.open = false;
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event('close')); };
  const cover = new Element(), seal = new Element(), prompt = new Element();
  const film = new Element(), video = new Video(), toggle = new Element(), skip = new Element();
  const status = new Element(), progress = new Element(), image = new Element();
  const heading = new Element(), hero = new Element(), replayFilm = new Element(), replayEnvelope = new Element();
  film.hidden = film.inert = true;
  status.classList.add('sr-only');
  image.complete = true;
  cover.querySelector = () => image;
  const selectors = {
    '[data-envelope-cover]': cover, '.wax-seal': seal,
    '[data-opening-film]': film, '[data-opening-video]': video,
    '[data-toggle-film]': toggle, '[data-open-invitation]': skip,
    '[data-film-status]': status, '[data-film-progress]': progress,
  };
  dialog.querySelector = (selector) => selectors[selector];
  dialog.querySelectorAll = () => [seal, prompt];
  doc.getElementById = (id) => ({
    'envelope-dialog': dialog, 'opening-film-title': heading, 'hero-title': hero, main: hero,
  })[id];
  doc.querySelector = (selector) => ({
    '[data-replay-film]': replayFilm, '[data-replay-envelope]': replayEnvelope,
  })[selector];
  const motion = new EventTarget();
  motion.matches = reduced;
  const win = new EventTarget();
  win.matchMedia = (query) => query.includes('reduced-motion') ? motion : { matches: mobile };
  win.location = { hash };
  win.performance = { getEntriesByType: () => [{ type: navigation }] };
  win.scrollTo = () => {};
  const globals = {
    document: doc, window: win, navigator: { connection },
    setTimeout: (callback, delay = 0) => {
      const id = ++nextTimer;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => previous
      ? Object.defineProperty(globalThis, name, previous) : Reflect.deleteProperty(globalThis, name));
  }
  initEnvelope();
  async function tick(milliseconds) {
    const end = now + milliseconds;
    for (;;) {
      const next = [...timers].filter(([, timer]) => timer.at <= end)
        .sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      timers.delete(next[0]);
      now = next[1].at;
      next[1].callback();
      await flush();
    }
    now = end;
    await flush();
  }
  function click(element) {
    assert.equal(element.disabled, false, 'the requested control remains usable');
    element.dispatchEvent(new Event('click'));
  }
  return { doc, win, motion, dialog, cover, seal, film, video, toggle, skip, status, hero,
    replayFilm, replayEnvelope, tick, click };
}

test('seal taps keep the film in the flow on slow, data-saving and reduced-motion devices', async (t) => {
  const profiles = [
    { name: 'data saver', connection: { saveData: true, effectiveType: '4g', downlink: 10 } },
    { name: '2g', connection: { effectiveType: '2g', downlink: 0.5 } },
    { name: 'slow-2g', connection: { effectiveType: 'slow-2g', downlink: 0.1 } },
    { name: 'low reported bandwidth', connection: { effectiveType: '3g', downlink: 0.5 } },
    { name: 'reduced motion', reduced: true },
    { name: 'unknown connection' },
  ];
  for (const profile of profiles) await t.test(profile.name, async (t) => {
    const f = fixture(t, profile);
    assert.equal(f.dialog.open, true);
    assert.equal(f.film.hidden, true);
    await f.tick(300);
    assert.equal(f.video.hasAttribute('src'), false, 'slow or unknown connections do not prefetch');
    f.click(f.seal);
    await f.tick(profile.reduced ? 0 : 500);
    assert.equal(f.dialog.open, true);
    assert.equal(f.cover.hidden, true);
    assert.equal(f.film.hidden, false);
    assert.equal(f.video.playCalls, 1);
    assert.equal(f.video.src, '/light.mp4');
    assert.equal(f.video.paused, false);
  });
});

test('fast desktops may prewarm the original film without starting playback before the tap', async (t) => {
  const f = fixture(t, {
    mobile: false, connection: { effectiveType: '4g', downlink: 10, rtt: 50 },
  });
  await f.tick(300);
  assert.equal(f.video.src, '/original.mp4');
  assert.equal(f.video.playCalls, 0);
  assert.equal(f.film.hidden, true);
  f.click(f.seal);
  await f.tick(500);
  assert.equal(f.video.src, '/original.mp4');
  assert.equal(f.video.playCalls, 1);
  assert.equal(f.film.hidden, false);
});

test('a pending film stays open with visible loading feedback and can be skipped', async (t) => {
  const f = fixture(t);
  const pending = deferred();
  f.video.playResults.push(() => pending.promise);
  f.click(f.seal);
  await f.tick(6500);
  assert.equal(f.dialog.open, true);
  assert.equal(f.film.hidden, false);
  assert.match(f.status.textContent, /film is loading/i);
  assert.equal(f.status.classList.contains('sr-only'), false);
  assert.equal(f.toggle.disabled, true);
  f.click(f.skip);
  await f.tick(500);
  assert.equal(f.dialog.open, false);
  assert.equal(f.video.hasAttribute('src'), false);
  assert.equal(f.doc.activeElement, f.hero);
  pending.reject(new Error('late network failure'));
  await flush();
  assert.equal(f.dialog.open, false, 'a stale play failure cannot reopen the intro');
  assert.doesNotMatch(f.status.textContent, /could not play/i);
});

test('a rejected play attempt offers a working retry instead of bypassing the film', async (t) => {
  const f = fixture(t);
  f.video.playResults.push(() => Promise.reject(new DOMException('Blocked', 'NotAllowedError')));
  f.click(f.seal);
  await f.tick(500);
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.paused, true);
  assert.equal(f.toggle.disabled, false);
  assert.match(f.toggle.textContent, /play film/i);
  assert.match(f.status.textContent, /could not play.*try again/i);
  assert.equal(f.status.classList.contains('sr-only'), false);
  f.click(f.toggle);
  await flush();
  assert.equal(f.video.playCalls, 2);
  assert.equal(f.video.paused, false);
  assert.match(f.status.textContent, /opening film playing/i);
  assert.equal(f.status.classList.contains('sr-only'), true);
  await f.tick(6000);
  assert.equal(f.dialog.open, true);
});

test('retry after a media error reloads the failed source and starts the film', async (t) => {
  const f = fixture(t);
  f.click(f.seal);
  await f.tick(500);
  const loads = f.video.loadCalls;
  f.video.error = { code: 2, message: 'Network interrupted' };
  f.video.dispatchEvent(new Event('error'));
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.paused, true);
  assert.equal(f.toggle.disabled, false);
  assert.match(f.status.textContent, /could not play/i);
  f.click(f.toggle);
  await flush();
  assert.ok(f.video.loadCalls > loads, 'a failed media element must be reset for retry');
  assert.equal(f.video.error, null);
  assert.equal(f.video.src, '/light.mp4');
  assert.equal(f.video.playCalls, 2);
  assert.equal(f.video.paused, false);
});

test('buffering longer than four seconds retains the film and clears its notice on recovery', async (t) => {
  const f = fixture(t);
  f.click(f.seal);
  await f.tick(500);
  f.video.dispatchEvent(new Event('waiting'));
  await f.tick(8000);
  assert.equal(f.dialog.open, true);
  assert.match(f.status.textContent, /film is buffering/i);
  assert.equal(f.status.classList.contains('sr-only'), false);
  assert.equal(f.skip.disabled, false);
  f.video.dispatchEvent(new Event('playing'));
  assert.match(f.status.textContent, /opening film playing/i);
  assert.equal(f.status.classList.contains('sr-only'), true);
});

test('a hidden-page play attempt cannot overwrite a later replay when it rejects', async (t) => {
  const f = fixture(t);
  const pending = deferred();
  f.video.playResults.push(() => pending.promise);
  f.click(f.seal);
  await f.tick(500);
  f.doc.hidden = true;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(f.video.paused, true);
  assert.equal(f.toggle.disabled, false);
  await f.tick(6000);
  assert.doesNotMatch(f.status.textContent, /loading/i);
  f.doc.hidden = false;
  f.click(f.skip);
  await f.tick(500);
  f.click(f.replayFilm);
  await f.tick(0);
  assert.equal(f.video.paused, false);
  pending.reject(new Error('old request failed'));
  await flush();
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.paused, false);
  assert.match(f.status.textContent, /opening film playing/i);
});

test('enabling reduced motion pauses the film and lets the visitor choose to continue', async (t) => {
  const f = fixture(t);
  f.click(f.seal);
  await f.tick(500);
  f.motion.matches = true;
  f.motion.dispatchEvent(new Event('change'));
  await f.tick(5000);
  assert.equal(f.dialog.open, true);
  assert.equal(f.video.paused, true);
  assert.equal(f.toggle.disabled, false);
  assert.match(f.status.textContent, /film paused/i);
  f.click(f.toggle);
  await flush();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.playCalls, 2);
});

test('refresh from a section still presents envelope, film and then invitation in order', async (t) => {
  const f = fixture(t, { hash: '#wishes', navigation: 'reload' });
  assert.equal(f.dialog.open, true);
  f.click(f.seal);
  await f.tick(500);
  assert.equal(f.film.hidden, false);
  f.video.currentTime = 10;
  f.video.ended = true;
  f.video.dispatchEvent(new Event('ended'));
  await f.tick(500);
  assert.equal(f.dialog.open, false);
  assert.equal(f.doc.activeElement, f.hero);
  f.click(f.replayEnvelope);
  assert.equal(f.dialog.open, true);
  assert.equal(f.film.hidden, true);
  f.click(f.seal);
  await f.tick(500);
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.video.playCalls, 2);
  assert.equal(f.film.hidden, false);
});

test('a direct section link keeps its existing intro bypass without loading media', async (t) => {
  const f = fixture(t, { hash: '#wishes' });
  await f.tick(10000);
  assert.equal(f.dialog.open, false);
  assert.equal(f.video.playCalls, 0);
  assert.equal(f.video.hasAttribute('src'), false);
});
