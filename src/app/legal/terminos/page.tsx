import type { Metadata } from 'next'
import { LegalShell, H2, P } from '../LegalShell'

export const metadata: Metadata = { title: 'Términos del servicio · LinkHub', description: 'Condiciones de uso de LinkHub.' }

export default function Page() {
  return (
    <LegalShell title="Términos del servicio">
      <P>Al crear una cuenta aceptas estas condiciones. <em>Borrador pendiente de revisión legal antes del lanzamiento.</em></P>
      <H2>El servicio</H2>
      <P>LinkHub te permite crear y publicar páginas profesionales, con funciones opcionales como pedidos, solicitudes de cita y cobros mediante pasarelas de terceros. Algunas funciones pueden estar desactivadas o en prueba según tu plan.</P>
      <H2>Tu cuenta y tu contenido</H2>
      <P>Eres responsable de lo que publicas y de que tengas derecho a hacerlo. No puedes usar LinkHub para contenido ilegal, engañoso o que infrinja derechos de terceros. Podemos retirar contenido o suspender páginas que incumplan estas condiciones.</P>
      <H2>Pagos y planes</H2>
      <P>El plan de pago se factura por suscripción mediante nuestro proveedor de pagos. Si un cobro falla, te avisamos y tienes un plazo para regularizarlo; pasado ese plazo tus páginas se pausan hasta que se resuelva. Puedes cancelar cuando quieras.</P>
      <P>Los cobros a tus propios clientes los procesa la pasarela que conectes. LinkHub no es parte de esas transacciones ni responsable de tus obligaciones fiscales.</P>
      <H2>Disponibilidad y responsabilidad</H2>
      <P>Hacemos lo posible por mantener el servicio disponible, pero se presta «tal cual». En la medida que permite la ley, nuestra responsabilidad se limita al importe pagado en los últimos 12 meses.</P>
      <H2>Cambios y contacto</H2>
      <P>Podemos actualizar estas condiciones avisando con antelación razonable. Dudas: hola@linkhub.johelpastorino.com.</P>
    </LegalShell>
  )
}
