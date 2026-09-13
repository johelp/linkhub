// Who gets into /admin (the LinkHub-operator panel, not a user's own
// dashboard). A plain env-var allowlist on purpose, not a DB column: a
// column would need the same self-escalation defense the `plan` column
// already needed (see migration 005) -- an env var can't be touched by any
// user session at all, so there's nothing to defend against. Closed by
// default: with ADMIN_EMAILS unset, nobody gets in, including in local dev.
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return allowlist.includes(email.toLowerCase())
}
