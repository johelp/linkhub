import test from 'node:test'
import assert from 'node:assert/strict'
import { ROADMAP, ROADMAP_KEYS, isRoadmapKey } from '../src/lib/roadmap.ts'

test('roadmap keys are unique and match the table constraint', () => {
  assert.equal(new Set(ROADMAP_KEYS).size, ROADMAP.length)
  for (const k of ROADMAP_KEYS) assert.match(k, /^[a-z0-9_]{1,40}$/)
})

test('isRoadmapKey only accepts known keys', () => {
  assert.equal(isRoadmapKey('custom_domain'), true)
  assert.equal(isRoadmapKey('nope'), false)
  assert.equal(isRoadmapKey(5), false)
})
