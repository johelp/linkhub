// Dependency-free SVG charts, rendered on the server (no JS shipped).
const R = '#E8150A'

export function Sparkline({ values, color = R, height = 36 }: { values: number[]; color?: string; height?: number }) {
  const w = 120
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? w / (values.length - 1) : w
  const pts = values.map((v, i) => [i * step, height - 3 - (v / max) * (height - 8)] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${height} L0,${height} Z`
  const id = `sp${color.replace('#', '')}${values.length}`
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export interface Series { label: string; values: number[]; color: string }

export function AreaChart({ days, series, height = 220 }: { days: string[]; series: Series[]; height?: number }) {
  const W = 720, padL = 32, padB = 22, padT = 8
  const innerW = W - padL - 6
  const innerH = height - padB - padT
  const max = Math.max(...series.flatMap(s => s.values), 1)
  const nice = Math.max(Math.ceil(max / 4) * 4, 4)
  const x = (i: number) => padL + (days.length > 1 ? (i / (days.length - 1)) * innerW : innerW / 2)
  const y = (v: number) => padT + innerH - (v / nice) * innerH
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(nice * t))
  const labelEvery = Math.ceil(days.length / 6)
  const summary = series.map(s => `${s.label}: ${s.values.reduce((a, b) => a + b, 0)}`).join(', ')
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" aria-label={`Gráfico de los últimos ${days.length} días. ${summary}`}>
      {ticks.map(t => (
        <g key={t}>
          <line x1={padL} x2={W - 6} y1={y(t)} y2={y(t)} stroke="rgba(26,27,28,0.07)" />
          <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#9A9D9F">{t}</text>
        </g>
      ))}
      {days.map((d, i) => i % labelEvery === 0 && (
        <text key={d} x={x(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="#9A9D9F">{d.slice(8)}/{d.slice(5, 7)}</text>
      ))}
      {series.map((s, si) => {
        const line = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
        const area = `${line} L${x(days.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
        return (
          <g key={s.label}>
            {si === 0 && <path d={area} fill={s.color} opacity=".10" />}
            <path d={line} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )
      })}
    </svg>
  )
}

export function Bar({ value, max, color = R }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F2F3F4' }} aria-hidden>
      <div className="h-full rounded-full" style={{ width: `${max ? Math.max((value / max) * 100, value ? 3 : 0) : 0}%`, background: color }} />
    </div>
  )
}
