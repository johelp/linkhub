import type { Metadata } from 'next'
import { LegalShell, H2, P } from '../LegalShell'

export const metadata: Metadata = { title: 'Política de cookies · LinkHub', description: 'Qué cookies y almacenamiento usamos y cómo cambiar tu elección.' }

export default function Page() {
  return (
    <LegalShell title="Política de cookies">
      <H2>Estrictamente necesarias</H2>
      <P>La sesión de tu cuenta en LinkHub y las preferencias de seguridad. No requieren consentimiento.</P>
      <H2>Medición y publicidad en páginas de clientes</H2>
      <P>Algunos clientes activan Google Analytics o Meta Pixel en su página. Solo se cargan <strong>si pulsas «Aceptar»</strong> en el aviso; si rechazas, no se carga ningún script de terceros. Tu elección se guarda en este navegador (clave <code>lh_tracking_consent</code>).</P>
      <H2>Cambiar tu elección</H2>
      <P>Borra los datos del sitio en tu navegador y el aviso volverá a aparecer.</P>
      <H2>Estadísticas propias</H2>
      <P>LinkHub cuenta visitas y clics de forma agregada para el panel del cliente, sin cookies publicitarias ni identificadores entre sitios.</P>
    </LegalShell>
  )
}
