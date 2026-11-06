// Shown instead of a customer's page when their plan has lapsed past the grace
// period. It deliberately says nothing about billing: to visitors the page is
// simply "being updated". The calm animation and the owner link do the rest.
export function PausedPage({ name, color, avatarUrl }: { name: string; color: string; avatarUrl?: string }) {
  const c = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#475569'
  return (
    <main className="lh-paused" style={{ ['--c' as string]: c }}>
      <div className="lh-paused-stage" aria-hidden>
        <span className="lh-ring r1" /><span className="lh-ring r2" /><span className="lh-ring r3" />
        {avatarUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={avatarUrl} alt="" width={88} height={88} className="lh-paused-avatar" style={{ objectFit: 'cover' }} />
          : <span className="lh-paused-avatar" style={{ background: c }}>{(name.trim()[0] || '•').toUpperCase()}</span>}
      </div>
      <h1 className="lh-paused-name">{name}</h1>
      <p className="lh-paused-text">Volvemos enseguida</p>
      <p className="lh-paused-sub">Estamos poniendo todo a punto para ti.</p>
      <div className="lh-paused-bar" role="progressbar" aria-label="Actualizando" aria-valuetext="Actualizando"><span /></div>
      <a className="lh-paused-owner" href="/auth?next=/dashboard/upgrade">¿Eres el titular? Accede a tu panel</a>
    </main>
  )
}
