import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { derivedKey, sign, verifyNotification, encodeParameters, buildPaymentForm, newOrderNumber, toCents, isAuthorised, validateCredentialsShape, decodeParameters } from '../src/lib/payments/redsys.ts'
import { chooseProvider, supportsCurrency } from '../src/lib/payments/meta.ts'
import { toMinorUnits } from '../src/lib/payments/payable.ts'
import { computeSteps } from '../src/lib/payments/steps.ts'

const secret = randomBytes(24).toString('base64') // same shape as a Redsys key (24 bytes, base64)

test('redsys: derived key is 8-byte aligned and depends on the order', () => {
  assert.equal(derivedKey(secret, '1234ABCD5678').length, 16)
  assert.notDeepEqual(derivedKey(secret, '1234ABCD5678'), derivedKey(secret, '1234ABCD5679'))
  assert.throws(() => derivedKey(Buffer.alloc(16).toString('base64'), '12345678'))
})

test('redsys: a signed notification verifies; tampering with params, order or signature does not', () => {
  const order = newOrderNumber()
  assert.match(order, /^\d{4}[0-9A-F]{8}$/)
  const mp = encodeParameters({ Ds_Order: order, Ds_Response: '0000', Ds_Amount: '1500', Ds_MerchantCode: '999008881' })
  const sig = sign(mp, order, secret)
  assert.equal(verifyNotification({ merchantParameters: mp, signature: sig, secretBase64: secret }).valid, true)
  // Redsys can return the signature base64url-encoded
  assert.equal(verifyNotification({ merchantParameters: mp, signature: sig.replace(/\+/g, '-').replace(/\//g, '_'), secretBase64: secret }).valid, true)
  const forged = encodeParameters({ Ds_Order: order, Ds_Response: '0000', Ds_Amount: '1', Ds_MerchantCode: '999008881' })
  assert.equal(verifyNotification({ merchantParameters: forged, signature: sig, secretBase64: secret }).valid, false)
  assert.equal(verifyNotification({ merchantParameters: mp, signature: sig, secretBase64: randomBytes(24).toString('base64') }).valid, false)
  assert.equal(verifyNotification({ merchantParameters: 'not-base64-json', signature: sig, secretBase64: secret }).valid, false)
})

test('redsys: payment form carries amount in cents, numeric currency and a valid signature', () => {
  const order = newOrderNumber()
  const { action, fields } = buildPaymentForm({
    creds: { merchantCode: '999008881', terminal: '1', secretBase64: secret, environment: 'test' },
    order, amount: 12.5, currency: 'EUR', description: 'Entrada', merchantName: 'Don Pepe',
    notificationUrl: 'https://x.test/n', okUrl: 'https://x.test/ok', koUrl: 'https://x.test/ko',
  })
  assert.equal(action, 'https://sis-t.redsys.es:25443/sis/realizarPago')
  const p = decodeParameters(fields.Ds_MerchantParameters)
  assert.equal(p.DS_MERCHANT_AMOUNT, '1250')
  assert.equal(p.DS_MERCHANT_CURRENCY, '978')
  assert.equal(fields.Ds_Signature, sign(fields.Ds_MerchantParameters, order, secret))
  assert.throws(() => buildPaymentForm({ creds: { merchantCode: '1', terminal: '1', secretBase64: secret, environment: 'live' }, order, amount: 1, currency: 'XXX', description: '', merchantName: '', notificationUrl: '', okUrl: '', koUrl: '' }))
  assert.equal(toCents(0.1 + 0.2), '30')
})

test('redsys: authorisation codes and credential validation', () => {
  assert.equal(isAuthorised({ Ds_Response: '0000' }), true)
  assert.equal(isAuthorised({ DS_RESPONSE: '0099' }), true)
  assert.equal(isAuthorised({ Ds_Response: '0101' }), false)
  assert.equal(isAuthorised({}), false)
  assert.equal(validateCredentialsShape({ merchantCode: '999008881', terminal: '1', secret }), null)
  assert.ok(validateCredentialsShape({ merchantCode: 'abc', terminal: '1', secret }))
  assert.ok(validateCredentialsShape({ merchantCode: '999008881', terminal: '1', secret: 'short' }))
})

test('provider choice respects explicit pick, currency support and region order', () => {
  assert.equal(chooseProvider(['mercadopago', 'stripe'], 'ARS', 'auto'), 'mercadopago')
  assert.equal(chooseProvider(['redsys', 'stripe'], 'EUR', 'auto'), 'stripe')
  assert.equal(chooseProvider(['redsys', 'stripe'], 'EUR', 'redsys'), 'redsys')
  assert.equal(chooseProvider(['mercadopago'], 'EUR', 'auto'), null, 'MP cannot charge EUR')
  assert.equal(chooseProvider([], 'ARS'), null)
  assert.equal(supportsCurrency('stripe', 'JPY'), true)
})

test('stripe minor units handle zero-decimal currencies', () => {
  assert.equal(toMinorUnits(10.5, 'EUR'), 1050)
  assert.equal(toMinorUnits(1500, 'CLP'), 1500)
  assert.equal(toMinorUnits(1500, 'jpy'), 1500)
})

test('wizard steps: first incomplete step is current, the rest todo', () => {
  assert.deepEqual(computeSteps({ connectedProviders: [], hasPaymentBlock: false, hasPublishedPaymentPage: false }), ['current', 'todo', 'todo'])
  assert.deepEqual(computeSteps({ connectedProviders: ['stripe'], hasPaymentBlock: false, hasPublishedPaymentPage: false }), ['done', 'current', 'todo'])
  assert.deepEqual(computeSteps({ connectedProviders: ['redsys'], hasPaymentBlock: true, hasPublishedPaymentPage: true }), ['done', 'done', 'done'])
})
