import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_KEYS_PER_ACCOUNT, checkKeyRow, generateApiKey, hashKey, hashesEqual, parseBearer, validateKeyInput, type ApiKeyRow } from '../src/lib/mcp/apiKeys.ts'
import { authenticate, type AuthDeps } from '../src/lib/mcp/auth.ts'
import { createLimiter } from '../src/lib/mcp/rateLimit.ts'
import { validate, type Schema } from '../src/lib/mcp/validate.ts'

const NOW = Date.parse('2026-11-02T08:00:00Z')

function rowFor(key: string, over: Partial<ApiKeyRow> = {}): ApiKeyRow {
  return { id: 'k1', user_id: 'u1', name: 't', key_prefix: key.slice(0, 9), key_hash: hashKey(key), scopes: ['pages:read'], last_used_at: null, expires_at: null, revoked_at: null, ...over }
}

test('generated keys: lh_ + 32 random bytes base64url, unique, hash is sha256 hex of the full key', () => {
  const a = generateApiKey(), b = generateApiKey()
  assert.match(a.key, /^lh_[A-Za-z0-9_-]{43}$/)
  assert.notEqual(a.key, b.key)
  assert.match(a.hash, /^[0-9a-f]{64}$/)
  assert.equal(a.hash, hashKey(a.key))
  assert.notEqual(a.hash, hashKey(b.key))
  assert.equal(a.prefix, a.key.slice(0, 9))
  assert.ok(!a.hash.includes(a.key.slice(3)), 'the stored hash does not contain the secret')
  const fixed = generateApiKey(() => Buffer.alloc(32, 1))
  assert.equal(fixed.key, 'lh_' + Buffer.alloc(32, 1).toString('base64url'))
})

test('constant-time compare and Bearer parsing', () => {
  const k = generateApiKey()
  assert.ok(hashesEqual(k.hash, hashKey(k.key)))
  assert.ok(!hashesEqual(k.hash, hashKey(k.key + 'x')))
  assert.ok(!hashesEqual('abc', 'abcd'), 'different lengths do not throw')
  assert.equal(parseBearer(`Bearer ${k.key}`), k.key)
  assert.equal(parseBearer(`bearer ${k.key}`), k.key)
  for (const bad of [null, '', 'Bearer', `Basic ${k.key}`, `Bearer ${k.key}x`, 'Bearer lh_short', `Bearer ${k.key} extra`, `Bearer ${'lh_' + 'A'.repeat(500)}`, 'Bearer sk_live_whatever']) assert.equal(parseBearer(bad), null, String(bad))
})

test('checkKeyRow: valid, wrong key, revoked, expired, unknown scopes dropped', () => {
  const k = generateApiKey()
  const ok = checkKeyRow(rowFor(k.key, { scopes: ['pages:read', 'root:everything'] }), k.key, NOW)
  assert.deepEqual(ok, { ok: true, scopes: ['pages:read'] })
  assert.deepEqual(checkKeyRow(rowFor(k.key), generateApiKey().key, NOW), { ok: false, reason: 'unknown' })
  assert.deepEqual(checkKeyRow(null, k.key, NOW), { ok: false, reason: 'unknown' })
  assert.deepEqual(checkKeyRow(rowFor(k.key, { revoked_at: '2026-11-01T00:00:00Z' }), k.key, NOW), { ok: false, reason: 'revoked' })
  assert.deepEqual(checkKeyRow(rowFor(k.key, { expires_at: '2026-11-02T07:59:59Z' }), k.key, NOW), { ok: false, reason: 'expired' })
  assert.equal(checkKeyRow(rowFor(k.key, { expires_at: '2026-11-02T08:00:01Z' }), k.key, NOW).ok, true)
  assert.deepEqual(checkKeyRow(rowFor(k.key, { expires_at: 'garbage' }), k.key, NOW), { ok: false, reason: 'expired' })
})

test('validateKeyInput: name, scopes, expiry', () => {
  const good = validateKeyInput({ name: ' Chatbot ', scopes: ['pages:read', 'pages:read', 'knowledge:read'], expiresAt: '2026-12-01T00:00:00Z' }, NOW)
  assert.ok(good.ok && good.value.name === 'Chatbot' && good.value.scopes.length === 2 && good.value.expiresAt === '2026-12-01T00:00:00.000Z')
  const no = (b: unknown) => assert.equal(validateKeyInput(b, NOW).ok, false, JSON.stringify(b))
  no(null); no({}); no({ name: '', scopes: ['pages:read'] }); no({ name: 'x'.repeat(61), scopes: ['pages:read'] })
  no({ name: 'a<b', scopes: ['pages:read'] }); no({ name: 'a', scopes: [] }); no({ name: 'a', scopes: ['admin'] }); no({ name: 'a', scopes: 'pages:read' })
  no({ name: 'a', scopes: ['pages:read'], expiresAt: '2020-01-01' }); no({ name: 'a', scopes: ['pages:read'], expiresAt: '2030-01-01' }); no({ name: 'a', scopes: ['pages:read'], expiresAt: 5 })
  assert.deepEqual(validateKeyInput({ name: 'a', scopes: ['pages:read'] }, NOW), { ok: true, value: { name: 'a', scopes: ['pages:read'], expiresAt: null } })
  assert.equal(MAX_KEYS_PER_ACCOUNT, 10)
})

// ─── authenticate() ─────────────────────────────────────────────

function authFixture(over: Partial<ApiKeyRow> = {}, flag = true) {
  const k = generateApiKey()
  const touched: string[] = []
  const lookups: string[] = []
  const deps: AuthDeps = {
    failLimiter: createLimiter({ capacity: 3, refillPerSec: 0.0001, now: () => NOW }),
    async findKeyByHash(h) { lookups.push(h); return h === hashKey(k.key) ? rowFor(k.key, over) : null },
    async getUserEmail() { return 'u@x.test' },
    async developerApiEnabled() { return flag },
    async touch(id) { touched.push(id) },
    now: () => NOW,
  }
  return { k, deps, touched, lookups }
}

test('authenticate: no header = public tier; a good key = principal with its scopes; last_used is touched', async () => {
  const f = authFixture({ scopes: ['pages:read', 'knowledge:read'] })
  assert.deepEqual(await authenticate(null, 'ip', f.deps), { ok: true, principal: null })
  const r = await authenticate(`Bearer ${f.k.key}`, 'ip', f.deps)
  assert.ok(r.ok && r.principal)
  assert.deepEqual(r.ok && r.principal && { u: r.principal.userId, k: r.principal.keyId, s: r.principal.scopes }, { u: 'u1', k: 'k1', s: ['pages:read', 'knowledge:read'] })
  assert.deepEqual(f.touched, ['k1'])
})

test('authenticate: wrong, revoked and expired keys are all 401 with the same message; never downgraded to public', async () => {
  const msgs = new Set<string>()
  for (const over of [{ revoked_at: '2026-11-01T00:00:00Z' }, { expires_at: '2026-11-01T00:00:00Z' }]) {
    const f = authFixture(over)
    const r = await authenticate(`Bearer ${f.k.key}`, 'ip', f.deps)
    assert.ok(!r.ok && r.status === 401)
    if (!r.ok) msgs.add(r.message)
  }
  const f = authFixture()
  const wrong = await authenticate(`Bearer ${generateApiKey().key}`, 'ip', f.deps)
  const garbage = await authenticate('Bearer nope', 'ip', f.deps)
  assert.ok(!wrong.ok && wrong.status === 401 && !garbage.ok && garbage.status === 401)
  assert.equal(f.lookups.length, 1, 'malformed keys never reach the database')
  assert.equal(msgs.size, 1)
})

test('authenticate: the developer_api flag gates authenticated use (403), and brute force is throttled (429)', async () => {
  const off = authFixture({}, false)
  const r = await authenticate(`Bearer ${off.k.key}`, 'ip', off.deps)
  assert.ok(!r.ok && r.status === 403 && r.code === 'developer_api_disabled')
  assert.deepEqual(off.touched, [])
  const f = authFixture()
  for (let i = 0; i < 3; i++) await authenticate(`Bearer ${generateApiKey().key}`, 'attacker', f.deps)
  const blocked = await authenticate(`Bearer ${f.k.key}`, 'attacker', f.deps) // even the right key is refused while throttled
  assert.ok(!blocked.ok && blocked.status === 429)
  assert.ok((await authenticate(`Bearer ${f.k.key}`, 'someone-else', f.deps)).ok, 'other IPs unaffected')
})

test('rate limiter: refill, eviction bound, peek', () => {
  let t = 0
  const l = createLimiter({ capacity: 2, refillPerSec: 1, maxKeys: 3, now: () => t })
  assert.ok(l.take('a').ok && l.take('a').ok)
  assert.ok(!l.take('a').ok && !l.peek('a'))
  t = 1000
  assert.ok(l.peek('a') && l.take('a').ok)
  for (const k of ['b', 'c', 'd']) l.take(k)
  assert.ok(l.take('a').ok, 'evicted key starts fresh (bounded memory)')
})

// ─── input validation ───────────────────────────────────────────

test('validate(): types, bounds, patterns, enums, nesting, unknown keys, control chars', () => {
  const schema: Schema = { type: 'object', required: ['s'], properties: {
    s: { type: 'string', minLength: 2, maxLength: 5, pattern: '^[a-z]+$' }, n: { type: 'integer', minimum: 1, maximum: 3 },
    e: { type: 'string', enum: ['x', 'y'] }, a: { type: 'array', maxItems: 2, items: { type: 'object', required: ['q'], properties: { q: { type: 'boolean' } } } },
    d: { type: 'string', format: 'date' } } }
  assert.deepEqual(validate(schema, { s: 'abc', n: 2, e: 'x', a: [{ q: true }], d: '2026-02-28' }), [])
  const bad = (v: unknown) => assert.ok(validate(schema, v).length > 0, JSON.stringify(v))
  bad(null); bad([]); bad({}); bad({ s: 'a' }); bad({ s: 'abcdef' }); bad({ s: 'ABC' }); bad({ s: 5 }); bad({ s: 'abc', n: 1.5 }); bad({ s: 'abc', n: 4 })
  bad({ s: 'abc', n: '2' }); bad({ s: 'abc', e: 'z' }); bad({ s: 'abc', a: [{}, {}, {}] }); bad({ s: 'abc', a: [{ q: 1 }] }); bad({ s: 'abc', extra: 1 })
  bad({ s: 'abc', d: '2026-02-30' }); bad({ s: 'abc', n: Infinity }); bad({ s: 'ab\u0000' })
  assert.deepEqual(validate({ type: 'string' }, 'línea1\nlínea2\tok'), [], 'newline and tab are fine')
})
