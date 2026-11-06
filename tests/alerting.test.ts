import test from 'node:test'
import assert from 'node:assert/strict'
import { scrub, formatAlert, createDeduper } from '../src/lib/alerting.ts'

test('scrub removes keys, tokens and emails', () => {
  const t = scrub('fail sk_live_abc123XYZ for ana@example.com with whsec_abcdef123456 and APP_USR-123-456')
  assert.doesNotMatch(t, /sk_live|ana@|whsec_|APP_USR/)
})

test('formatAlert truncates and scrubs', () => {
  const a = formatAlert('webhook:stripe', new Error('x'.repeat(900) + ' ana@example.com'), 'production')
  assert.equal(a.message.length <= 500, true)
  assert.equal(a.scope, 'webhook:stripe')
})

test('deduper suppresses repeats inside the window only', () => {
  let now = 0
  const ok = createDeduper(1000, () => now)
  const a = { scope: 's', message: 'm', env: 'e' }
  assert.equal(ok(a), true)
  assert.equal(ok(a), false)
  now = 1500
  assert.equal(ok(a), true)
  assert.equal(ok({ ...a, message: 'other' }), true)
})
