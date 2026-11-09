// Shown on example pages instead of opening WhatsApp: what the business would receive.
export function PreviewNote({ message, what }: { message: string; what: string }) {
  return (
    <div role="status" style={{ marginTop: 10, borderRadius: 12, background: '#ECFDF5', border: '1px solid #BBF7D0', padding: 12 }}>
      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Ejemplo: así recibiría el negocio este {what} en WhatsApp</p>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12.5, color: '#14532D', lineHeight: 1.5 }}>{message.replace(/\*/g, '')}</pre>
    </div>
  )
}
