import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { googleBackend, wishInput, clone } from './helpers/google-apps-script.mjs';

const types = ['like', 'love', 'care', 'haha', 'wow', 'sad', 'angry'];
const emptyCounts = () => Object.fromEntries(types.map((type) => [type, 0]));
const hash = (value) => createHash('sha256').update(value.toLowerCase()).digest('hex');
function approve(b, overrides) {
  b.api.submitWish(wishInput(overrides));
  const entry = b.api.listModeration(b.key).find((entry) => entry.status === 'pending');
  b.api.moderateWish(b.key, entry.id, 'approve', entry.revision);
  return entry.id;
}
function state(b, ids, token) {
  return clone(b.api.getPublicReactionState_(ids, token));
}

test('reaction reads and a first removal do not create a store or change wishes', () => {
  const b = googleBackend();
  const id = approve(b);
  const token = randomUUID();
  const original = clone(b.rows);
  const emails = b.emails.length;
  assert.deepEqual(state(b, [id]), { [id]: { counts: emptyCounts(), selected: '' } });
  assert.deepEqual(state(b, [id], token), state(b, [id]));
  assert.deepEqual(clone(b.api.setPublicWishReaction(id, token, '')), {
    status: 'ready',
    id,
    counts: emptyCounts(),
    selected: '',
  });
  assert.equal(b.tabs.has('WishReactions'), false);
  assert.deepEqual(clone(b.rows), original);
  assert.equal(b.emails.length, emails);
});

test('each supported reaction is shared while the visitor selection stays private', () => {
  const b = googleBackend();
  const id = approve(b);
  const tokens = types.map(() => randomUUID());
  const original = clone(b.rows);
  const emails = b.emails.length;
  for (const [index, type] of types.entries()) {
    const reply = clone(b.api.setPublicWishReaction(id, tokens[index], type));
    assert.equal(reply.status, 'ready');
    assert.equal(reply.selected, type);
    assert.deepEqual(Object.keys(reply).sort(), ['counts', 'id', 'selected', 'status']);
  }
  const everyone = state(b, [id]);
  assert.deepEqual(everyone[id], {
    counts: Object.fromEntries(types.map((type) => [type, 1])),
    selected: '',
  });
  for (const [index, type] of types.entries())
    assert.equal(state(b, [id], tokens[index])[id].selected, type);
  const rows = b.tabs.get('WishReactions').rows;
  assert.equal(rows.length, 8);
  assert.deepEqual(rows[0], ['Wish ID', 'Visitor hash', 'Reaction', 'Updated at']);
  assert.equal(rows[1][1], hash(tokens[0]));
  for (const token of tokens) {
    assert.ok(!JSON.stringify(rows).includes(token));
    assert.ok(!JSON.stringify(everyone).includes(hash(token)));
  }
  assert.deepEqual(clone(b.rows), original);
  assert.equal(b.emails.length, emails);
});

test('retries, switching and removal keep one vote per visitor and wish', () => {
  const b = googleBackend();
  const id = approve(b);
  const token = randomUUID();
  b.api.setPublicWishReaction(id, token, 'love');
  const saved = clone(b.tabs.get('WishReactions').rows);
  b.api.setPublicWishReaction(id, token.toUpperCase(), 'love');
  assert.deepEqual(clone(b.tabs.get('WishReactions').rows), saved);
  let result = clone(b.api.setPublicWishReaction(id, token, 'care'));
  assert.equal(result.counts.love, 0);
  assert.equal(result.counts.care, 1);
  assert.equal(result.selected, 'care');
  assert.equal(b.tabs.get('WishReactions').rows.length, 2);
  result = clone(b.api.setPublicWishReaction(id, token, ''));
  assert.deepEqual(result.counts, emptyCounts());
  assert.equal(result.selected, '');
  const removed = clone(b.tabs.get('WishReactions').rows);
  b.api.setPublicWishReaction(id, token, '');
  assert.deepEqual(clone(b.tabs.get('WishReactions').rows), removed);
  b.api.setPublicWishReaction(id, token, 'haha');
  assert.equal(b.tabs.get('WishReactions').rows.length, 2);
  assert.equal(state(b, [id], token)[id].counts.haha, 1);
});

test('visitors and wishes keep independent selections and counts', () => {
  const b = googleBackend();
  const first = approve(b);
  const second = approve(b);
  const alice = randomUUID();
  const bob = randomUUID();
  b.api.setPublicWishReaction(first, alice, 'love');
  b.api.setPublicWishReaction(first, bob, 'love');
  b.api.setPublicWishReaction(second, alice, 'wow');
  const a = state(b, [first, second], alice);
  const other = state(b, [first, second], bob);
  assert.equal(a[first].counts.love, 2);
  assert.equal(a[first].selected, 'love');
  assert.equal(a[second].counts.wow, 1);
  assert.equal(a[second].selected, 'wow');
  assert.equal(other[second].selected, '');
  b.api.setPublicWishReaction(first, alice, '');
  assert.equal(state(b, [first, second], bob)[first].counts.love, 1);
  assert.equal(state(b, [first, second], alice)[second].selected, 'wow');
});

test('both public languages return shared counts and only the requesting browser selection', () => {
  const b = googleBackend();
  const id = approve(b);
  const alice = randomUUID();
  const bob = randomUUID();
  b.api.setPublicWishReaction(id, alice, 'love');
  b.api.setPublicWishReaction(id, bob, 'care');
  for (const language of ['en', 'ur']) {
    const personal = clone(b.api.getPublicWishes(language, alice))[0];
    assert.equal(personal.reactions.counts.love, 1);
    assert.equal(personal.reactions.counts.care, 1);
    assert.equal(personal.reactions.selected, 'love');
    assert.equal(b.api.getPublicWishes(language)[0].reactions.selected, '');
    assert.ok(!JSON.stringify(personal).includes(hash(alice)));
    assert.ok(!JSON.stringify(personal).includes(hash(bob)));
  }
  const legacy = clone(b.api.getPublicWishes())[0];
  assert.deepEqual(Object.keys(legacy).sort(), ['createdAt', 'message', 'name']);
  b.api.moderateWish(b.key, id, 'hide', 2);
  for (const language of ['en', 'ur'])
    assert.deepEqual(clone(b.api.getPublicWishes(language, alice)), []);
});

test('pending, rejected, hidden and missing wishes cannot be reacted to', () => {
  const b = googleBackend();
  const token = randomUUID();
  b.api.submitWish(wishInput());
  const id = b.api.listModeration(b.key)[0].id;
  for (const status of ['pending', 'rejected', 'hidden']) {
    b.rows[1][5] = status;
    assert.deepEqual(clone(b.api.setPublicWishReaction(id, token, 'love')), {
      status: 'unavailable',
    });
  }
  assert.deepEqual(clone(b.api.setPublicWishReaction(randomUUID(), token, 'love')), {
    status: 'unavailable',
  });
  assert.equal(b.tabs.has('WishReactions'), false);
  b.rows[1][5] = 'approved';
  b.api.setPublicWishReaction(id, token, 'love');
  b.rows[1][5] = 'hidden';
  const saved = clone(b.tabs.get('WishReactions').rows);
  assert.deepEqual(clone(b.api.setPublicWishReaction(id, token, '')), {
    status: 'unavailable',
  });
  assert.deepEqual(clone(b.tabs.get('WishReactions').rows), saved);
  assert.deepEqual(state(b, [], token), {});
});

test('invalid IDs, tokens and reaction payloads fail before creating or writing a tab', () => {
  const b = googleBackend();
  const id = approve(b);
  const token = randomUUID();
  for (const invalid of ['', null, {}, '=IMPORTXML("https://example.test")', 'x'.repeat(5000)]) {
    assert.throws(() => b.api.setPublicWishReaction(invalid, token, 'like'), /reload/);
    assert.throws(() => b.api.setPublicWishReaction(id, invalid, 'like'), /reload/);
  }
  for (const invalid of [null, {}, 'LOVE', 'celebrate', '=1+1', 'like\n'])
    assert.throws(() => b.api.setPublicWishReaction(id, token, invalid), /reload/);
  assert.throws(() => b.api.getPublicReactionState_([id], 'invalid'), /reload/);
  assert.equal(b.tabs.has('WishReactions'), false);
  // The browser's offline UUID-shaped fallback need not encode a UUID version.
  assert.equal(
    b.api.setPublicWishReaction(id, '00000000-0000-0000-0000-000000000000', 'like')
      .selected,
    'like',
  );
});

test('a busy lock cannot accept a write and a mismatched tab is preserved', () => {
  const b = googleBackend();
  const id = approve(b);
  b.blockLock();
  assert.throws(() => b.api.setPublicWishReaction(id, randomUUID(), 'love'), /busy/);
  assert.equal(b.tabs.has('WishReactions'), false);
  const foreign = [['Family reaction notes'], ['Keep this existing data']];
  const other = googleBackend({ initialTabs: { Sheet1: [], WishReactions: foreign } });
  const otherId = approve(other);
  assert.throws(() => other.api.setPublicWishReaction(otherId, randomUUID(), 'love'), /store/);
  assert.deepEqual(other.tabs.get('WishReactions').rows, foreign);
});

test('an existing empty tab gets headers on first write and not on public reads', () => {
  const b = googleBackend({ initialTabs: { Sheet1: [], WishReactions: [] } });
  const id = approve(b);
  const token = randomUUID();
  assert.deepEqual(state(b, [id], token)[id].counts, emptyCounts());
  assert.deepEqual(b.tabs.get('WishReactions').rows, []);
  b.api.setPublicWishReaction(id, token, 'care');
  assert.equal(b.tabs.get('WishReactions').rows.length, 2);
  assert.equal(b.tabs.get('WishReactions').rows[0][0], 'Wish ID');
  assert.equal(state(b, [id], token)[id].counts.care, 1);
});

test('duplicate private rows do not inflate a vote and unrelated records are excluded', () => {
  const b = googleBackend();
  const id = approve(b);
  const token = randomUUID();
  b.api.setPublicWishReaction(id, token, 'love');
  const rows = b.tabs.get('WishReactions').rows;
  rows.push([id, hash(token), 'care', new Date().toISOString()]);
  rows.push([randomUUID(), hash(token), 'love', new Date().toISOString()]);
  rows.push([id, hash(randomUUID()), 'unsupported', new Date().toISOString()]);
  rows.push([id, 'malformed hash', 'love', new Date().toISOString()]);
  const result = state(b, [id], token);
  assert.deepEqual(result, {
    [id]: { counts: { ...emptyCounts(), care: 1 }, selected: 'care' },
  });
  b.api.setPublicWishReaction(id, token, '');
  assert.deepEqual(state(b, [id], token)[id], { counts: emptyCounts(), selected: '' });
});

test('store capacity stops new votes but lets existing visitors change and remove theirs', () => {
  const b = googleBackend();
  const id = approve(b);
  const alice = randomUUID();
  const bob = randomUUID();
  b.api.WISH_REACTION_ROW_LIMIT_ = 2;
  b.api.setPublicWishReaction(id, alice, 'love');
  b.api.setPublicWishReaction(id, bob, 'like');
  const saved = clone(b.tabs.get('WishReactions').rows);
  assert.throws(() => b.api.setPublicWishReaction(id, randomUUID(), 'care'), /unavailable/);
  assert.deepEqual(clone(b.tabs.get('WishReactions').rows), saved);
  assert.equal(b.api.setPublicWishReaction(id, alice, 'wow').counts.wow, 1);
  assert.equal(b.api.setPublicWishReaction(id, alice, '').counts.wow, 0);
});
