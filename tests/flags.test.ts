import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bucket, evaluateFlag, resolveFlags, hiddenBlockTypes } from '../src/lib/flags.ts'

const U1 = '11111111-1111-1111-1111-111111111111'

test('new features ship OFF by default (no row, no override)', () => {
  assert.equal(evaluateFlag('redsys', U1, undefined, undefined), false)
})

test('override beats everything, in both directions', () => {
  assert.equal(evaluateFlag('redsys', U1, undefined, true), true)
  assert.equal(evaluateFlag('redsys', U1, { key: 'redsys', enabled_default: true, rollout_percent: 100 }, false), false)
})

test('"enabled for everyone" wins over the percentage', () => {
  assert.equal(evaluateFlag('redsys', U1, { key: 'redsys', enabled_default: true, rollout_percent: 0 }, undefined), true)
})

test('rollout is deterministic, monotonic and roughly proportional', () => {
  const users = Array.from({ length: 2000 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`)
  const at = (p: number) => new Set(users.filter(u => evaluateFlag('stripe_connect', u, { key: 'stripe_connect', enabled_default: false, rollout_percent: p }, undefined)))
  const s10 = at(10), s50 = at(50), s100 = at(100)
  assert.ok(s10.size > 140 && s10.size < 260, `10% -> ${s10.size}`)
  assert.ok(s50.size > 900 && s50.size < 1100, `50% -> ${s50.size}`)
  assert.equal(s100.size, 2000)
  for (const u of s10) assert.ok(s50.has(u), 'raising the % never removes a customer')
  assert.equal(bucket('stripe_connect', U1), bucket('stripe_connect', U1))
})

test('admins get every feature; hidden blocks follow the flags', () => {
  const adminFlags = resolveFlags(U1, [], [], true)
  assert.ok(Object.values(adminFlags).every(Boolean))
  const customer = resolveFlags(U1, [], [{ flag_key: 'appointment_block', enabled: true }], false)
  assert.deepEqual(hiddenBlockTypes(customer), ['order_menu'])
  assert.deepEqual(hiddenBlockTypes(adminFlags), [])
})
