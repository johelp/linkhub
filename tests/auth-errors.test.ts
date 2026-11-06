import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyAuthFailure, isAuthFailure } from '../src/lib/authErrors.ts'

test('classifies the failures people actually hit', () => {
  assert.equal(classifyAuthFailure({ errorCode: 'otp_expired', error: 'access_denied', description: 'Email link is invalid or has expired' }), 'expired')
  assert.equal(classifyAuthFailure({ message: 'PKCE code verifier not found in storage' }), 'verifier')
  assert.equal(classifyAuthFailure({ error: 'access_denied' }), 'denied')
  assert.equal(classifyAuthFailure({ message: 'something else' }), 'callback')
})

test('isAuthFailure only accepts known codes', () => {
  assert.equal(isAuthFailure('expired'), true)
  assert.equal(isAuthFailure('<script>'), false)
})
