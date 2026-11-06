import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isSafeUrl, safeNextPath, sanitizeBlocks, sanitizeSettings } from '../src/lib/security.ts'

test('isSafeUrl allows web, mail, tel and relative paths', () => {
  for (const u of ['https://a.com', 'http://a.com/x?y=1', 'mailto:a@b.co', 'tel:+5411', '/dashboard', '#', '']) assert.equal(isSafeUrl(u), true, u)
})

test('isSafeUrl rejects script-capable and malformed schemes', () => {
  for (const u of ['javascript:alert(1)', ' JaVaScRiPt:alert(1)', 'data:text/html,<script>', 'vbscript:x', '//evil.com', 'file:///etc/passwd', 'not a url']) assert.equal(isSafeUrl(u), false, u)
})

test('safeNextPath blocks open redirects', () => {
  assert.equal(safeNextPath('/editor/abc'), '/editor/abc')
  for (const bad of ['//evil.com', '@evil.com', 'https://evil.com', '/\\evil.com', null, undefined, '/a\nb']) assert.equal(safeNextPath(bad as string), '/dashboard', String(bad))
})

test('sanitizeBlocks blanks unsafe urls deeply and keeps safe ones', () => {
  const blocks = [
    { id: '1', type: 'link', data: { url: 'javascript:alert(1)', translations: { es: { title: 'x' } } } },
    { id: '2', type: 'expandable', data: { children: [{ id: 'c', url: 'data:text/html,x' }, { id: 'd', url: 'https://ok.com' }] } },
    { id: '3', type: 'image_banner', data: { imageUrl: 'javascript:x', url: 'https://ok.com' } },
  ] as never
  const out = sanitizeBlocks(blocks) as unknown as Array<{ data: Record<string, unknown> & { children?: Array<{ url: string }> } }>
  assert.equal(out[0].data.url, '')
  assert.equal(out[1].data.children![0].url, '')
  assert.equal(out[1].data.children![1].url, 'https://ok.com')
  assert.equal(out[2].data.imageUrl, '')
  assert.equal(out[2].data.url, 'https://ok.com')
})

test('sanitizeSettings keeps only http(s) images and caps the tagline', () => {
  const out = sanitizeSettings({ profile: { avatarUrl: 'javascript:x', coverUrl: 'https://img/c.jpg', tagline: 'x'.repeat(500) }, seo: { ogImage: 'data:image/png;base64,AA' } })
  assert.equal(out.profile!.avatarUrl, '')
  assert.equal(out.profile!.coverUrl, 'https://img/c.jpg')
  assert.equal(out.profile!.tagline!.length, 160)
  assert.equal(out.seo!.ogImage, null)
})
