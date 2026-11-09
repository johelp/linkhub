import test from 'node:test'
import assert from 'node:assert/strict'
import { AUTH_TEMPLATES, ticketEmail } from '../src/lib/emailTemplates.ts'

test('auth templates keep Supabase placeholders intact', () => {
  const magic = AUTH_TEMPLATES.find(t => t.key === 'magic_link')!
  assert.ok(magic.html.includes('{{ .ConfirmationURL }}'))
  assert.ok(magic.text.includes('{{ .Email }}'))
  assert.ok(AUTH_TEMPLATES.find(t => t.key === 'reauthentication')!.html.includes('{{ .Token }}'))
  assert.equal(AUTH_TEMPLATES.length, 6)
  // Sign-in and sign-up emails carry the one-time code AND the link.
  for (const key of ['magic_link', 'confirmation']) {
    const t = AUTH_TEMPLATES.find(x => x.key === key)!
    assert.ok(t.html.includes('{{ .Token }}') && t.html.includes('{{ .ConfirmationURL }}'), key)
    assert.ok(t.subject.includes('{{ .Token }}'), key)
    assert.ok(t.text.includes('{{ .Token }}'), key)
  }
})

test('no template uses voseo or emoji', () => {
  for (const t of AUTH_TEMPLATES) {
    assert.doesNotMatch(t.html, /\b(Tocá|Presentá|Hacé|Ingresá)\b/)
    assert.doesNotMatch(t.html, /\p{Extended_Pictographic}/u)
  }
})

test('dynamic text in transactional mail is escaped', () => {
  const m = ticketEmail({ eventName: '<script>x</script>', tierName: 'A&B', ticketUrl: 'https://x.test/t/1' })
  assert.ok(!m.html.includes('<script>x'))
  assert.ok(m.html.includes('A&amp;B'))
})
