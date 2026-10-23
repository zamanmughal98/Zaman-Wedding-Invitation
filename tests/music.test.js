import test from 'node:test';
import assert from 'node:assert/strict';
import { initMusic } from '../src/features/music.js';

function fixture(t, { startOnOpen = true, webAudio = true, play } = {}) {
  const players = [],
    contexts = [];
  const buttons = Array.from({ length: 2 }, () => {
    const control = new EventTarget();
    control.disabled = false;
    control.attributes = new Map();
    control.setAttribute = (name, value) => control.attributes.set(name, value);
    return control;
  });
  const button = buttons[0];
  const triggers = [new EventTarget(), new EventTarget()];
  const notice = { hidden: true, textContent: '' };
  const doc = new EventTarget();
  doc.hidden = false;
  doc.querySelector = (selector) =>
    selector === '[data-toggle-music]' ? button : selector === '.toast' ? notice : null;
  doc.querySelectorAll = (selector) => (selector === '[data-toggle-music]' ? buttons : triggers);
  const win = new EventTarget();
  class Context {
    constructor() {
      this.state = 'suspended';
      this.destination = {};
      this.sources = [];
      contexts.push(this);
    }
    createGain() {
      return (this.master = { gain: { value: 1 }, connect() {} });
    }
    createMediaElementSource(element) {
      this.sources.push(element);
      return { connect() {} };
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    suspend() {
      this.state = 'suspended';
      return Promise.resolve();
    }
    close() {
      this.state = 'closed';
      return Promise.resolve();
    }
  }
  if (webAudio) win.AudioContext = Context;
  class Player {
    constructor() {
      this.paused = true;
      this.volume = 1;
      this.plays = 0;
      players.push(this);
    }
    play() {
      this.plays++;
      this.paused = false;
      return play ? play(this) : Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
  }
  for (const [name, value] of Object.entries({ document: doc, window: win, Audio: Player })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, writable: true, configurable: true });
    t.after(() =>
      previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name],
    );
  }
  initMusic({
    music: {
      src: '/assets/music/samjhawan-unplugged.mp3',
      volume: 0.12,
      startOnOpen,
    },
  });
  return { button, buttons, triggers, players, contexts, doc, notice };
}
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const tap = (element) => element.dispatchEvent(new Event('click'));

test('music waits for the invitation tap, starts softly once, and respects a later mute', async (t) => {
  const f = fixture(t);
  assert.equal(f.players.length, 0);
  tap(f.triggers[0]);
  await flush();
  assert.equal(f.players.length, 1);
  const player = f.players[0];
  assert.equal(player.src, './assets/music/samjhawan-unplugged.mp3');
  assert.equal(player.loop, true);
  assert.equal(f.contexts[0].master.gain.value, 0.12);
  assert.equal(f.button.attributes.get('aria-pressed'), 'true');
  tap(f.triggers[1]);
  await flush();
  assert.equal(player.plays, 1);
  tap(f.button);
  await flush();
  assert.equal(player.paused, true);
  tap(f.triggers[0]);
  await flush();
  assert.equal(player.plays, 1);
  tap(f.button);
  await flush();
  assert.equal(player.plays, 2);
  assert.equal(f.players.length, 1);
  assert.equal(f.contexts[0].sources.length, 1);
});

test('sound-button-only configuration does not start music when entering', async (t) => {
  const f = fixture(t, { startOnOpen: false });
  tap(f.triggers[0]);
  await flush();
  assert.equal(f.players.length, 0);
  tap(f.button);
  await flush();
  assert.equal(f.players[0].paused, false);
});

test('film and header sound controls share playback and mute state', async (t) => {
  const f = fixture(t);
  tap(f.buttons[1]);
  await flush();
  assert.equal(f.players.length, 1);
  for (const control of f.buttons) {
    assert.equal(control.attributes.get('aria-pressed'), 'true');
    assert.equal(control.attributes.get('aria-label'), 'Mute background music');
    assert.equal(control.disabled, false);
  }
  tap(f.buttons[0]);
  await flush();
  assert.equal(f.players[0].paused, true);
  for (const control of f.buttons) assert.equal(control.attributes.get('aria-pressed'), 'false');
  tap(f.triggers[0]);
  await flush();
  assert.equal(f.players[0].plays, 1, "a later seal tap must preserve the guest's mute");
});

test('failed playback leaves a usable sound button and a visible recovery message', async (t) => {
  t.mock.method(globalThis, 'setTimeout', () => 0);
  let fail = true;
  const f = fixture(t, {
    play: () => (fail ? Promise.reject(new Error('Playback blocked')) : Promise.resolve()),
  });
  tap(f.triggers[0]);
  await flush();
  assert.equal(f.players[0].paused, true);
  assert.equal(f.button.disabled, false);
  assert.equal(f.button.attributes.get('aria-pressed'), 'false');
  assert.equal(f.notice.hidden, false);
  assert.match(f.notice.textContent, /Tap again/);
  fail = false;
  tap(f.button);
  await flush();
  assert.equal(f.players[0].paused, false);
});

test('hiding the page while the track loads cancels playback after loading completes', async (t) => {
  let complete;
  const f = fixture(t, {
    play: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  });
  tap(f.triggers[0]);
  f.doc.hidden = true;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  complete();
  await flush();
  assert.equal(f.players[0].paused, true);
  assert.equal(f.button.attributes.get('aria-pressed'), 'false');
  assert.equal(f.button.disabled, false);
  f.doc.hidden = false;
  f.doc.dispatchEvent(new Event('visibilitychange'));
  await flush();
  assert.equal(f.players[0].plays, 1);
});

test('browsers without Web Audio still receive the configured soft media volume', async (t) => {
  const f = fixture(t, { webAudio: false });
  tap(f.triggers[0]);
  await flush();
  assert.equal(f.players[0].volume, 0.12);
  assert.equal(f.players[0].paused, false);
});
