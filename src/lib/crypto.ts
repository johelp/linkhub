import crypto from 'crypto'

// Field-level encryption for third-party secrets stored in Postgres (Mercado
// Pago OAuth tokens). AES-256-GCM with a key that lives only in the server
// environment, so a database leak or a read-only SQL access alone doesn't
// expose seller credentials.
//
//   TOKEN_ENCRYPTION_KEY = 32 random bytes, base64 (`openssl rand -base64 32`)
//
// Format: "enc:v1:<iv>.<tag>.<ciphertext>" (base64url). Values without the
// prefix are legacy plaintext and are returned as-is, so turning this on needs
// no data migration: old rows keep working and are re-encrypted next time the
// seller reconnects (or by scripts/encrypt-existing-tokens in the runbook).
const PREFIX = 'enc:v1:'

function key(): Buffer | null {
  const raw = process.env.TOKEN_ENCRYPTION_KEY
  if (!raw) return null
  const buf = Buffer.from(raw, 'base64')
  if (buf.length !== 32) throw new Error('TOKEN_ENCRYPTION_KEY must be 32 bytes, base64-encoded')
  return buf
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX)
}

export function encryptSecret(plain: string): string {
  const k = key()
  if (!k) {
    // Fail open in dev, loudly in production: storing plaintext is the
    // pre-existing behaviour, never silently worse than before.
    if (process.env.NODE_ENV === 'production') console.error('TOKEN_ENCRYPTION_KEY is not set: storing the token unencrypted')
    return plain
  }
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', k, iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `${PREFIX}${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ct.toString('base64url')}`
}

export function decryptSecret(stored: string): string {
  if (!isEncrypted(stored)) return stored
  const k = key()
  if (!k) throw new Error('Encrypted secret found but TOKEN_ENCRYPTION_KEY is not set')
  const [iv, tag, ct] = stored.slice(PREFIX.length).split('.')
  const decipher = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(iv, 'base64url'))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  return Buffer.concat([decipher.update(Buffer.from(ct, 'base64url')), decipher.final()]).toString('utf8')
}
