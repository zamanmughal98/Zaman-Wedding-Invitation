import test from 'node:test';
import assert from 'node:assert/strict';
import { initWishesEmbed, isWishResizeMessage } from '../src/features/wishes-embed.js';

const serviceUrl = 'https://script.google.com/macros/s/PUBLIC_TEST_ONLY/exec?view=wall';
const googleOrigin = 'https://guestbook.example.googleusercontent.com';
const draftKey = 'zaman-nimra-wish-draft-v1';
const flush = async () => { for (let index = 0; index < 12; index++) await Promise.resolve(); };

/** Controllable image readiness, Google messages, draft storage and time. No network is used. */
function fixture(t, { nativeForm = true, images = 0, imagesComplete = true, draft, blockedStorage = false } = {}) {
  let now = 0, nextTimer = 0;
  const timers = new Map(), requests = [], stored = new Map();
  if (draft) stored.set(draftKey, JSON.stringify(draft));
  class Element extends EventTarget {
    constructor() {
      super();
      this.attributes = new Map();
      this.dataset = {};
      this.style = {};
      this.hidden = false;
      this.disabled = false;
      this.textContent = '';
      this.value = '';
      this.classes = new Set();
      this.classList = {
        add: (...values) => values.forEach(value => this.classes.add(value)),
        remove: (...values) => values.forEach(value => this.classes.delete(value)),
        contains: value => this.classes.has(value),
        toggle: (value, force = !this.classes.has(value)) => {
          if (force) this.classes.add(value); else this.classes.delete(value);
          return force;
        },
      };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    setCustomValidity(value) { this.validationMessage = value; }
  }
  const frame = new Element();
  frame.dataset.src = serviceUrl;
  frame.clientHeight = 600;
  Object.defineProperty(frame, 'src', {
    get: () => frame.getAttribute('src') || 'about:blank',
    set: value => { frame.setAttribute('src', value); requests.push(value); },
  });
  const wrapper = new Element(), loading = new Element(), connection = new Element(), retry = new Element();
  wrapper.classList.add('is-loading');
  frame.closest = () => wrapper;
  const form = new Element(), status = new Element(), submit = new Element();
  submit.disabled = true;
  form.elements = { name: new Element(), message: new Element(), _honey: new Element() };
  form.reportValidity = () => Object.values(form.elements).every(field => !field.validationMessage) &&
    Boolean(form.elements.name.value && form.elements.message.value);
  form.resetCalls = 0;
  form.reset = () => { form.resetCalls++; for (const field of Object.values(form.elements)) field.value = ''; };
  form.querySelector = selector => selector.includes('submit') ? submit : status;
  const selectors = {
    '.wishes-widget': frame, '[data-wishes-frame]': wrapper, '.wishes-widget-frame': wrapper,
    '[data-wishes-loading]': loading, '[data-wishes-connection]': connection,
    '[data-retry-wishes]': retry, '[data-google-wish-form]': nativeForm ? form : null,
    '[data-google-wish-status]': status,
  };
  wrapper.querySelector = selector => selectors[selector] || null;
  const priorityImages = Array.from({ length: images }, () => {
    const image = new Element();
    image.complete = imagesComplete;
    image.naturalWidth = imagesComplete ? 512 : 0;
    return image;
  });
  const intro = new Element();
  intro.open = true;
  intro.querySelectorAll = () => priorityImages;
  const doc = new EventTarget();
  doc.documentElement = { lang: 'en' };
  doc.querySelector = selector => selectors[selector] || null;
  doc.querySelectorAll = selector => /img/.test(selector) ? priorityImages : [];
  doc.getElementById = id => id === 'envelope-dialog' ? intro : null;
  const win = new EventTarget();
  win.IntersectionObserver = class { constructor() { throw Error('Viewport must not gate background loading.'); } };
  const storage = {
    getItem(key) { if (blockedStorage) throw Error('Storage unavailable'); return stored.get(key) ?? null; },
    setItem(key, value) { if (blockedStorage) throw Error('Storage unavailable'); stored.set(key, String(value)); },
    removeItem(key) { if (blockedStorage) throw Error('Storage unavailable'); stored.delete(key); },
  };
  win.localStorage = storage;
  const globals = {
    document: doc, window: win, location: new URL('https://invitation.example/'), localStorage: storage,
    setTimeout: (callback, delay = 0) => {
      const id = ++nextTimer;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout: id => timers.delete(id),
  };
  for (const [name, value] of Object.entries(globals)) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : Reflect.deleteProperty(globalThis, name));
  }
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
  function message(data, origin = googleOrigin, source = peer) {
    const event = new Event('message');
    Object.assign(event, { data, origin, source });
    win.dispatchEvent(event);
  }
  const sent = [];
  const peer = { postMessage: (data, origin) => sent.push({ data, origin }) };
  function channel() { return new URL(frame.src).searchParams.get('embedChannel'); }
  function ready(extra = {}, origin = googleOrigin, source = peer) {
    message({ type: 'wedding:wishes:resize', channel: channel(), height: 800,
      viewportHeight: 568, viewportWidth: 390, hostForm: nativeForm, ...extra }, origin, source);
  }
  function input(name, value) {
    const field = form.elements[name];
    field.value = value;
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: field });
    form.dispatchEvent(event);
  }
  function sendForm() { form.dispatchEvent(new Event('submit', { cancelable: true })); }
  function receipt(requestId, accepted = true, extra = {}, origin = googleOrigin, source = peer) {
    message({ type: 'wedding:wishes:submitted', channel: channel(), requestId, accepted, ...extra }, origin, source);
  }
  return { frame, wrapper, loading, connection, retry, form, status, submit, doc, win, intro, priorityImages,
    stored, requests, sent, peer, channel, message, ready, input, sendForm, receipt, tick };
}

test('the Google guestbook starts behind the intro after priority images settle, without waiting for scroll', async t => {
  const f = fixture(t, { images: 2, imagesComplete: false });
  initWishesEmbed();
  await flush();
  assert.deepEqual(f.requests, []);
  f.frame.dataset.src = serviceUrl + '&lang=ur';
  f.priorityImages[0].dispatchEvent(new Event('load'));
  await flush();
  assert.deepEqual(f.requests, []);
  f.priorityImages[1].dispatchEvent(new Event('error'));
  await flush();
  assert.equal(f.intro.open, true);
  assert.equal(f.requests.length, 1);
  const url = new URL(f.frame.src);
  assert.equal(url.searchParams.get('lang'), 'ur');
  assert.equal(url.searchParams.get('hostForm'), '1');
  assert.equal(url.searchParams.get('parentOrigin'), 'https://invitation.example');
  assert.match(f.channel(), /^[a-f0-9-]{36}$/);
  assert.equal(f.frame.loading, 'eager');
  initWishesEmbed();
  await flush();
  assert.equal(f.requests.length, 1);
});

test('the permanent local form restores its draft while Google has not responded', async t => {
  const f = fixture(t, { draft: { requestId: crypto.randomUUID(), name: 'Family guest', message: 'Our duas' } });
  assert.equal(f.submit.disabled, true);
  initWishesEmbed();
  assert.equal(f.submit.disabled, false, 'submission is enabled after its handler is bound, without waiting for Google');
  await flush();
  assert.equal(f.requests.length, 1);
  assert.equal(f.form.hidden, false);
  assert.equal(f.form.elements.name.value, 'Family guest');
  assert.equal(f.form.elements.message.value, 'Our duas');
  f.input('message', 'A new wish');
  assert.equal(JSON.parse(f.stored.get(draftKey)).message, 'A new wish');
  assert.equal(f.wrapper.classList.contains('is-loading'), true);
});

test('a slow Google connection offers retry without hiding or losing the editable form', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  const initialChannel = f.channel();
  f.input('name', 'Guest');
  f.input('message', 'A draft while the service connects');
  await f.tick(8001);
  assert.equal(f.retry.hidden, false);
  assert.match(f.connection.textContent, /taking longer to connect/i);
  assert.equal(f.form.hidden, false);
  f.retry.dispatchEvent(new Event('click'));
  await flush();
  assert.equal(f.requests.length, 2);
  assert.notEqual(f.channel(), initialChannel);
  assert.equal(f.form.elements.message.value, 'A draft while the service connects');
  f.ready({ channel: initialChannel });
  assert.equal(f.wrapper.classList.contains('is-loading'), true);
  f.ready();
  assert.equal(f.wrapper.classList.contains('is-loading'), false);
});

test('authenticated ready messages reveal and size the wall, and native-form capability is required', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  f.ready({}, 'https://untrusted.example');
  f.ready({ channel: crypto.randomUUID() });
  assert.equal(f.wrapper.classList.contains('is-loading'), true);
  f.ready({ hostForm: false });
  assert.equal(f.wrapper.classList.contains('is-loading'), true);
  f.ready();
  assert.equal(f.wrapper.classList.contains('is-loading'), false);
  assert.equal(f.frame.style.height, '832px');
  assert.ok(f.sent.some(({ data }) => data.type === 'wedding:wishes:resize-ack'));
  assert.equal(f.form.hidden, false);
});

test('an explicit send waits for Google readiness and only its accepted receipt clears the form', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  f.input('name', 'Family guest');
  f.input('message', 'A warm wish');
  f.sendForm();
  await flush();
  assert.equal(f.submit.disabled, true);
  assert.equal(f.sent.filter(({ data }) => data.type === 'wedding:wishes:submit').length, 0);
  f.ready();
  await flush();
  const sends = f.sent.filter(({ data }) => data.type === 'wedding:wishes:submit');
  assert.equal(sends.length, 1);
  const { requestId, payload } = sends[0].data;
  assert.equal(sends[0].origin, googleOrigin);
  assert.match(requestId, /^[a-f0-9-]{36}$/);
  assert.deepEqual(payload, { name: 'Family guest', message: 'A warm wish', website: '' });
  f.receipt(requestId, true, {}, 'https://untrusted.example');
  f.receipt(requestId, true, {}, googleOrigin, { postMessage() {} });
  f.receipt(crypto.randomUUID());
  f.receipt(requestId, true, { channel: crypto.randomUUID() });
  await flush();
  assert.equal(f.form.resetCalls, 0);
  assert.equal(f.submit.disabled, true);
  f.receipt(requestId);
  await flush();
  assert.equal(f.form.resetCalls, 1);
  assert.equal(f.submit.disabled, false);
  assert.match(f.status.textContent, /saved for family approval/i);
  assert.equal(JSON.parse(f.stored.get(draftKey)).message, '');
});

test('a connection timeout keeps the wish and retry uses its original request ID', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  f.input('name', 'Guest');
  f.input('message', 'Please keep this draft');
  f.sendForm();
  await flush();
  const requestId = JSON.parse(f.stored.get(draftKey)).requestId;
  await f.tick(20001);
  assert.equal(f.submit.disabled, false);
  assert.equal(f.form.elements.message.value, 'Please keep this draft');
  assert.match(f.status.textContent, /still in the form/i);
  f.ready();
  f.sendForm();
  await flush();
  const sends = f.sent.filter(({ data }) => data.type === 'wedding:wishes:submit');
  assert.equal(sends.length, 1);
  assert.equal(sends[0].data.requestId, requestId);
  f.receipt(requestId, false);
  await flush();
  assert.equal(f.form.resetCalls, 0);
  assert.equal(f.submit.disabled, false);
  assert.equal(f.form.elements.message.value, 'Please keep this draft');
});

test('a success for an older message does not erase an edit made while sending', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  f.ready();
  f.input('name', 'Guest');
  f.input('message', 'First message');
  f.sendForm();
  await flush();
  const requestId = f.sent.find(({ data }) => data.type === 'wedding:wishes:submit').data.requestId;
  f.input('message', 'A newer unsent message');
  f.receipt(requestId);
  await flush();
  assert.equal(f.form.resetCalls, 0);
  assert.equal(f.form.elements.message.value, 'A newer unsent message');
  assert.equal(JSON.parse(f.stored.get(draftKey)).message, 'A newer unsent message');
  assert.equal(f.submit.disabled, false);
});

test('a language reload resends a pending request on the new channel and rejects the old response', async t => {
  const f = fixture(t);
  initWishesEmbed();
  await flush();
  f.ready();
  f.input('name', 'Guest');
  f.input('message', 'A pending wish');
  f.sendForm();
  await flush();
  const first = f.sent.find(({ data }) => data.type === 'wedding:wishes:submit').data;
  const url = new URL(f.frame.src);
  url.searchParams.set('embedChannel', crypto.randomUUID());
  url.searchParams.set('lang', 'ur');
  f.frame.src = url.href;
  f.doc.documentElement.lang = 'ur';
  f.doc.dispatchEvent(new Event('wedding:language'));
  f.receipt(first.requestId, true, { channel: first.channel });
  await flush();
  assert.equal(f.form.resetCalls, 0);
  const secondPeer = { postMessage: (data, origin) => f.sent.push({ data, origin }) };
  f.ready({}, googleOrigin, secondPeer);
  await flush();
  const sends = f.sent.filter(({ data }) => data.type === 'wedding:wishes:submit');
  assert.equal(sends.length, 2);
  assert.equal(sends[1].data.requestId, first.requestId);
  assert.notEqual(sends[1].data.channel, first.channel);
  f.receipt(first.requestId, true, {}, googleOrigin, secondPeer);
  await flush();
  assert.equal(f.form.resetCalls, 1);
});

test('the native form remains usable when browser storage is unavailable', async t => {
  const f = fixture(t, { blockedStorage: true });
  initWishesEmbed();
  await flush();
  f.ready();
  f.input('name', 'Guest');
  f.input('message', 'A wish without storage');
  f.sendForm();
  await flush();
  const requestId = f.sent.find(({ data }) => data.type === 'wedding:wishes:submit').data.requestId;
  f.receipt(requestId);
  await flush();
  assert.equal(f.form.resetCalls, 1);
  assert.equal(f.submit.disabled, false);
});

test('legacy embedded pages without a native form retain the validated resize handshake', async t => {
  const f = fixture(t, { nativeForm: false });
  initWishesEmbed();
  await flush();
  assert.equal(new URL(f.frame.src).searchParams.has('hostForm'), false);
  f.ready();
  assert.equal(f.frame.style.height, '832px');
  assert.ok(isWishResizeMessage({ data: { type: 'wedding:wishes:resize', channel: f.channel(), height: 800,
    viewportHeight: 568, viewportWidth: 390 }, origin: googleOrigin, source: f.peer }, f.channel(), new URL(serviceUrl).origin));
  assert.equal(isWishResizeMessage({ data: {}, origin: 'invalid', source: f.peer }, f.channel(), new URL(serviceUrl).origin), false);
});
