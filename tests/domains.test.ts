import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDomain, isApexDomain, dnsRecords, txtMatches, routeForCustomerHost, isPlatformHost, verifyHost } from '../src/lib/domains.ts'

const PLATFORM = ['linkhub.johelpastorino.com']

test('normalizeDomain cleans pasted URLs and lowercases', () => {
  assert.deepEqual(normalizeDomain('  HTTPS://WWW.Mi-Sitio.com/contacto?x=1 '), { ok: true, domain: 'www.mi-sitio.com' })
  assert.deepEqual(normalizeDomain('tunegocio.es:443'), { ok: true, domain: 'tunegocio.es' })
  assert.deepEqual(normalizeDomain('bücher.example.com'), { ok: true, domain: 'xn--bcher-kva.example.com' })
})

test('normalizeDomain rejects unusable hosts', () => {
  for (const bad of ['', 'localhost', '10.0.0.1', 'foo', 'a@b.com', 'has space.com', 'x.vercel.app', 'sub.linkhub.johelpastorino.com', 'linkhub.johelpastorino.com', '-bad.com', 'bad-.com']) {
    assert.equal(normalizeDomain(bad, PLATFORM).ok, false, bad)
  }
})

test('apex detection covers common two-label suffixes', () => {
  assert.equal(isApexDomain('tunegocio.com'), true)
  assert.equal(isApexDomain('tunegocio.com.ar'), true)
  assert.equal(isApexDomain('www.tunegocio.com'), false)
  assert.equal(isApexDomain('reservas.tunegocio.com.ar'), false)
})

test('dnsRecords: subdomain uses CNAME, apex uses A, both include the TXT proof', () => {
  const sub = dnsRecords('reservas.tunegocio.com', 'abc')
  assert.deepEqual(sub.find(r => r.purpose === 'verify'), { purpose: 'verify', type: 'TXT', name: '_linkhub-verify.reservas', value: 'linkhub-verify=abc' })
  assert.deepEqual(sub.find(r => r.purpose === 'route'), { purpose: 'route', type: 'CNAME', name: 'reservas', value: 'cname.vercel-dns.com' })
  const apex = dnsRecords('tunegocio.com', 'abc')
  assert.equal(apex.find(r => r.purpose === 'route')?.type, 'A')
  assert.equal(apex.find(r => r.purpose === 'verify')?.name, '_linkhub-verify')
  assert.equal(dnsRecords('www.tunegocio.com.ar', 'abc').find(r => r.purpose === 'route')?.name, 'www')
  assert.equal(verifyHost('www.x.com'), '_linkhub-verify.www.x.com')
})

test('txtMatches joins TXT chunks and needs the exact token', () => {
  assert.equal(txtMatches([['linkhub-verify=', 'abc']], 'abc'), true)
  assert.equal(txtMatches([['linkhub-verify=abcd']], 'abc'), false)
  assert.equal(txtMatches([['otra cosa']], 'abc'), false)
})

test('customer hosts can only reach the public page and its endpoints', () => {
  assert.deepEqual(routeForCustomerHost('/', 'ana'), { kind: 'rewrite', path: '/p/ana' })
  assert.deepEqual(routeForCustomerHost('/llms.txt', 'ana'), { kind: 'rewrite', path: '/p/ana/llms.txt' })
  assert.deepEqual(routeForCustomerHost('/_next/static/a.js', 'ana'), { kind: 'pass' })
  assert.deepEqual(routeForCustomerHost('/api/pay/stripe', 'ana'), { kind: 'pass' })
  for (const p of ['/dashboard', '/editor/1', '/admin', '/auth', '/api/pages', '/api/mcp', '/api/admin/flags', '/p/otro']) {
    assert.deepEqual(routeForCustomerHost(p, 'ana'), { kind: 'deny' }, p)
  }
})

test('platform hosts are never treated as customer domains', () => {
  assert.equal(isPlatformHost('linkhub.johelpastorino.com', PLATFORM), true)
  assert.equal(isPlatformHost('linkhub-git-x.vercel.app', PLATFORM), true)
  assert.equal(isPlatformHost('localhost:3000', PLATFORM), true)
  assert.equal(isPlatformHost('www.mipsicologa.com', PLATFORM), false)
})
