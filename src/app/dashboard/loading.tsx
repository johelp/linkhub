export default function Loading() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ height: 28, width: 180, borderRadius: 8, background: 'rgba(26,27,28,0.06)', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {[1,2,3].map(i => (
          <div key={i} style={{ height: 160, borderRadius: 16, background: 'rgba(26,27,28,0.05)', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
