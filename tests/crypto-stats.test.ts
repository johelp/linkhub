import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { encryptSecret, decryptSecret, isEncrypted } from '../src/lib/crypto.ts'
import { aggregateEvents, delta, lastNDays, seriesFor } from '../src/lib/dashboardStats.ts'

test('secrets round-trip, are not plaintext, and tampering is detected', () => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  const enc = encryptSecret('APP_USR-123')
  assert.ok(isEncrypted(enc) && !enc.includes('APP_USR'))
  assert.equal(decryptSecret(enc), 'APP_USR-123')
  assert.notEqual(encryptSecret('APP_USR-123'), enc, 'random IV')
  const parts = enc.split('.'); parts[2] = parts[2].slice(0, -2) + 'AA'
  assert.throws(() => decryptSecret(parts.join('.')))
})

test('legacy plaintext passes through; missing key on encrypted data throws', () => {
  assert.equal(decryptSecret('plain-token'), 'plain-token')
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64')
  const enc = encryptSecret('x')
  delete process.env.TOKEN_ENCRYPTION_KEY
  assert.throws(() => decryptSecret(enc))
})

test('aggregateEvents + helpers', () => {
  const r = aggregateEvents([
    { page_id: 'p', event_type: 'view', block_id: null, block_type: null, device: 'mobile', created_at: '2026-11-01T10:00:00Z' },
    { page_id: 'p', event_type: 'view', block_id: null, block_type: null, device: null, created_at: '2026-11-01T11:00:00Z' },
    { page_id: 'p', event_type: 'click', block_id: 'b1', block_type: 'link', device: null, created_at: '2026-11-02T10:00:00Z' },
  ])
  assert.deepEqual(r.daily.map(d => [d.day, d.views, d.clicks]), [['2026-11-01', 2, 0], ['2026-11-02', 0, 1]])
  assert.equal(r.topBlocks[0].clicks, 1)
  assert.deepEqual(seriesFor(r.daily, ['2026-11-01', '2026-11-02', '2026-11-03'], 'views'), [2, 0, 0])
  assert.equal(delta(150, 100), 50)
  assert.equal(delta(5, 0), null)
  assert.equal(lastNDays(3, new Date('2026-11-05T12:00:00Z')).join(), '2026-11-03,2026-11-04,2026-11-05')
})
