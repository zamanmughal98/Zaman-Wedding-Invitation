import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const template = await readFile(new URL('../backend/google-wishes/Index.html', import.meta.url), 'utf8');
const source = template.slice(
  template.indexOf('function initGuestSubmitBridge()'),
  template.indexOf('function initGuestResize()'),
);
const channel = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const requestId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const parentOrigin = 'https://wedding.example';
const clone = (value) => JSON.parse(JSON.stringify(value));

/** Exercise the actual embedded listener with hostile messages and delayed RPC. */
function bridge({ admin = false, hostForm = true, standalone = false, language = 'en', run } = {}) {
  const calls = [], replies = [], listeners = [];
  const top = { postMessage: (data, origin) => replies.push({ data: clone(data), origin }) };
  const window = { top, addEventListener: (type, listener) => { if (type === 'message') listeners.push(listener); } };
  if (standalone) window.top = window;
  const page = { admin, language, embed: { channel, parentOrigin, hostForm } };
  const context = vm.createContext({
    PAGE: page, window,
    guestText: (en, ur) => language === 'ur' ? ur : en,
    rpc: async (method, payload) => {
      calls.push({ method, payload: clone(payload) });
      return run ? run(method, payload) : { accepted: true };
    },
  });
  vm.runInContext(source + '\ninitGuestSubmitBridge();', context);
  const input = () => ({
    type: 'wedding:wishes:submit', channel, requestId,
    payload: { name: ' Family Guest ', message: ' May Allah bless your new beginning. ', website: '' },
  });
  async function send(data = input(), changes = {}) {
    await Promise.all(listeners.map((listener) => listener({ source: top, origin: parentOrigin, data, ...changes })));
  }
  return { calls, replies, listeners, top, input, send };
}

test('the embedded form bridge accepts only its top page, origin, channel and request type', async () => {
  const b = bridge();
  await b.send(b.input(), { source: {} });
  await b.send(b.input(), { origin: 'https://untrusted.example' });
  await b.send({ ...b.input(), channel: 'old-channel' });
  await b.send({ ...b.input(), type: 'listModeration' });
  await b.send({ ...b.input(), type: 'wedding:wishes:resize-ack' });
  await b.send(null);
  assert.deepEqual(b.calls, []);
  assert.deepEqual(b.replies, []);
  await b.send();
  assert.deepEqual(b.calls, [{
    method: 'submitWish',
    payload: { requestId, name: 'Family Guest', message: 'May Allah bless your new beginning.', website: '' },
  }]);
  assert.deepEqual(b.replies, [{
    origin: parentOrigin,
    data: { type: 'wedding:wishes:submitted', channel, requestId, accepted: true, error: '' },
  }]);
});

test('bridge validation rejects malformed IDs and oversized or missing request fields', async () => {
  const b = bridge();
  for (const id of ['', 'not-a-uuid', requestId + '\n', {}, null])
    await b.send({ ...b.input(), requestId: id });
  for (const payload of [
    null, [], {},
    { name: ' ', message: 'A wish', website: '' },
    { name: 'Guest', message: ' ', website: '' },
    { name: 'x'.repeat(101), message: 'A wish', website: '' },
    { name: 'Guest', message: 'x'.repeat(501), website: '' },
    { name: 'Guest', message: 'A wish', website: 'x'.repeat(201) },
    { name: 'Guest', message: 'A wish' },
    { name: 42, message: 'A wish', website: '' },
  ]) await b.send({ ...b.input(), payload });
  assert.deepEqual(b.calls, []);
  assert.deepEqual(b.replies, []);
});

test('parent messages cannot select private RPCs or smuggle extra server fields', async () => {
  const b = bridge();
  const data = b.input();
  data.method = 'moderateWish';
  Object.assign(data.payload, { requestId: 'overridden', method: 'listModeration', key: 'secret', status: 'approved' });
  await b.send(data);
  assert.equal(b.calls.length, 1);
  assert.equal(b.calls[0].method, 'submitWish');
  assert.deepEqual(Object.keys(b.calls[0].payload).sort(), ['message', 'name', 'requestId', 'website']);
  assert.equal(b.calls[0].payload.requestId, requestId);
});

test('duplicate messages share the existing in-flight submission and allow an idempotent retry', async () => {
  let finish;
  const waiting = new Promise((resolve) => { finish = resolve; });
  const b = bridge({ run: () => waiting });
  const first = b.send();
  await b.send();
  assert.equal(b.calls.length, 1);
  assert.equal(b.replies.length, 0);
  finish({ accepted: true });
  await first;
  assert.equal(b.replies.length, 1);
  await b.send();
  assert.equal(b.calls.length, 2, 'the backend handles a retry using the unchanged request ID');
  assert.equal(b.calls[1].payload.requestId, requestId);
});

test('bridge failures expose only a safe public error and never private server details', async () => {
  const b = bridge({ run: () => { throw new Error('MODERATOR_KEY=private SHEET_ID=private-stack'); } });
  await b.send();
  assert.equal(b.replies[0].data.accepted, false);
  assert.equal(b.replies[0].data.error, 'Your wish could not be saved. Please try again.');
  assert.doesNotMatch(JSON.stringify(b.replies), /MODERATOR_KEY|SHEET_ID|private-stack/);
  const invalid = bridge({ run: () => ({ accepted: 'true' }) });
  await invalid.send();
  assert.equal(invalid.replies[0].data.accepted, false);
  const urdu = bridge({ language: 'ur', run: () => Promise.reject(new Error('private')) });
  await urdu.send();
  assert.match(urdu.replies[0].data.error, /[\u0600-\u06ff]/);
});

test('private moderation and standalone or legacy guestbooks never register a host submission bridge', () => {
  for (const options of [{ admin: true }, { hostForm: false }, { standalone: true }]) {
    const b = bridge(options);
    assert.deepEqual(b.listeners, []);
    assert.deepEqual(b.calls, []);
  }
});
