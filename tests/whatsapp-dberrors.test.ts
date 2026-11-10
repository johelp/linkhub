import test from 'node:test'
import assert from 'node:assert/strict'
import { withPageWhatsapp, cleanWhatsapp } from '../src/lib/whatsapp.ts'
import { classifyDbError, dbFailureMessage } from '../src/lib/dbErrors.ts'

const page = (wa: string | undefined, blocks: { type: string; data: { whatsapp?: string } }[]) => ({ settings: { profile: { whatsapp: wa } }, blocks })

test('page WhatsApp fills order and appointment blocks that have none', () => {
  const p = withPageWhatsapp(page('+34 600 000 000', [
    { type: 'order_menu', data: { whatsapp: '' } },
    { type: 'appointment_request', data: {} },
    { type: 'order_menu', data: { whatsapp: '+54 9 11 2345 6789' } },
    { type: 'link', data: {} },
  ]))
  assert.equal(p.blocks[0].data.whatsapp, '+34 600 000 000')
  assert.equal(p.blocks[1].data.whatsapp, '+34 600 000 000')
  assert.equal(p.blocks[2].data.whatsapp, '+54 9 11 2345 6789')   // own number wins
  assert.equal(p.blocks[3].data.whatsapp, undefined)
})

test('no page WhatsApp leaves the page untouched; input is cleaned', () => {
  const p = page(undefined, [{ type: 'order_menu', data: { whatsapp: '' } }])
  assert.equal(withPageWhatsapp(p), p)
  assert.equal(cleanWhatsapp('<b>+34 6</b>00'), '+34 600')
  assert.equal(cleanWhatsapp(5), '')
})

test('db errors: invalid key is not reported as a missing migration', () => {
  assert.equal(classifyDbError({ status: 401, message: 'Invalid API key' }), 'key')
  assert.equal(classifyDbError({ code: '42P01', message: 'relation "x" does not exist' }), 'missing')
  assert.equal(classifyDbError({ code: 'XX000', message: 'boom' }), 'other')
  assert.equal(classifyDbError(null), null)
  assert.match(dbFailureMessage('key', '016'), /SUPABASE_SERVICE_ROLE_KEY/)
  assert.match(dbFailureMessage('missing', '016_feature_flags.sql'), /016_feature_flags/)
})
