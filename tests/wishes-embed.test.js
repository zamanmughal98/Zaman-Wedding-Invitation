import test from 'node:test';
import assert from 'node:assert/strict';
import { initWishesEmbed } from '../src/features/wishes-embed.js';

const serviceUrl = 'https://script.google.com/macros/s/PUBLIC_TEST_ONLY/exec?view=wall';

function fixture({ observer = true, introOpen = false } = {}) {
  const names = ['window', 'document', 'location', 'IntersectionObserver'];
  const previous = new Map(names.map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  const requests = [];
  const attributes = new Map();
  const frame = {
    dataset: { src: serviceUrl },
    style: {},
    clientHeight: 900,
    getAttribute(name) { return attributes.get(name) || null; },
    removeAttribute(name) { attributes.delete(name); },
    get src() { return attributes.get('src') || 'about:blank'; },
    set src(value) { attributes.set('src', value); requests.push(value); },
  };
  const intro = new EventTarget();
  intro.open = introOpen;
  const watchers = [];
  class FakeIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      watchers.push(this);
    }
    observe(target) { this.target = target; }
    disconnect() { this.disconnected = true; }
    intersect(value) { this.callback([{ target: this.target, isIntersecting: value }]); }
  }
  const window = new EventTarget();
  window.IntersectionObserver = observer ? FakeIntersectionObserver : undefined;
  Object.assign(globalThis, {
    window,
    document: { querySelector: () => frame, getElementById: () => intro },
    location: new URL('https://invitation.example/'),
    IntersectionObserver: FakeIntersectionObserver,
  });
  return {
    frame, requests, watchers,
    closeIntro() { intro.open = false; intro.dispatchEvent(new Event('close')); },
    message(data, origin, source) {
      const event = new Event('message');
      Object.assign(event, { data, origin, source });
      window.dispatchEvent(event);
    },
    restore() {
      for (const [name, descriptor] of previous) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else Reflect.deleteProperty(globalThis, name);
      }
    },
  };
}

test('the guestbook requests nothing until it approaches the viewport and the intro closes', () => {
  const f = fixture({ introOpen: true });
  try {
    initWishesEmbed();
    assert.deepEqual(f.requests, []);
    assert.equal(f.watchers[0].options.rootMargin, '500px 0px');
    f.watchers[0].intersect(true);
    assert.deepEqual(f.requests, []);
    // A language chosen while waiting must be used for the first Google request.
    f.frame.dataset.src = serviceUrl + '&lang=ur';
    f.closeIntro();
    assert.equal(f.requests.length, 1);
    const url = new URL(f.requests[0]);
    assert.equal(url.searchParams.get('lang'), 'ur');
    assert.equal(url.searchParams.get('parentOrigin'), 'https://invitation.example');
    assert.match(url.searchParams.get('embedChannel'), /^[a-f0-9-]{36}$/);
    assert.equal(f.frame.dataset.src, undefined);
    assert.equal(f.frame.loading, 'eager');
    assert.equal(f.watchers[0].disconnected, true);
    initWishesEmbed();
    f.closeIntro();
    assert.equal(f.requests.length, 1);
  } finally { f.restore(); }
});

test('closing the intro keeps a distant guestbook deferred until it approaches', () => {
  const f = fixture({ introOpen: true });
  try {
    initWishesEmbed();
    f.watchers[0].intersect(false);
    f.closeIntro();
    assert.deepEqual(f.requests, []);
    f.watchers[0].intersect(true);
    assert.equal(f.requests.length, 1);
  } finally { f.restore(); }
});

test('without IntersectionObserver the intro still completes before loading Google', () => {
  const f = fixture({ observer: false, introOpen: true });
  try {
    initWishesEmbed();
    assert.deepEqual(f.requests, []);
    f.closeIntro();
    assert.equal(f.requests.length, 1);
  } finally { f.restore(); }
});

test('an activated guestbook keeps header sizing and rejects resize messages from an old language view', () => {
  const f = fixture();
  try {
    initWishesEmbed();
    f.watchers[0].intersect(true);
    const url = new URL(f.frame.src);
    const channel = url.searchParams.get('embedChannel');
    const acknowledgements = [];
    const source = { postMessage: (...args) => acknowledgements.push(args) };
    const data = {
      type: 'wedding:wishes:resize', channel, height: 2400,
      viewportHeight: 868, viewportWidth: 390,
    };
    f.message(data, 'https://example.googleusercontent.com', source);
    assert.equal(f.frame.style.height, '2432px');
    assert.equal(acknowledgements.length, 1);
    url.searchParams.set('embedChannel', crypto.randomUUID());
    url.searchParams.set('lang', 'ur');
    f.frame.src = url.href;
    f.message({ ...data, height: 200 }, 'https://example.googleusercontent.com', source);
    assert.equal(f.frame.style.height, '2432px');
    assert.equal(acknowledgements.length, 1);
  } finally { f.restore(); }
});
