import type { Metadata } from 'next'
import { LegalShell, H2, P } from '../LegalShell'

export const metadata: Metadata = { title: 'Política de privacidad · LinkHub', description: 'Qué datos trata LinkHub, para qué y qué derechos tienes.' }

export default function Page() {
  return (
    <LegalShell title="Política de privacidad">
      <P>LinkHub es la plataforma con la que profesionales y pequeños negocios crean su página pública. Esta política explica qué datos tratamos y por qué.</P>
      <H2>Responsable</H2>
      <P>[Razón social / nombre del titular], [domicilio], contacto: hola@linkhub.johelpastorino.com. <em>(Completar antes del lanzamiento.)</em></P>
      <H2>Dos roles distintos</H2>
      <P><strong>Si tienes una cuenta en LinkHub</strong> (cliente), somos responsables de los datos de tu cuenta y facturación. <strong>Si visitas la página de un cliente</strong>, el cliente es el responsable de lo que recoja allí (por ejemplo, pedidos o solicitudes de cita) y LinkHub actúa como su proveedor tecnológico.</P>
      <H2>Qué datos tratamos</H2>
      <P>Cuenta: correo electrónico, nombre del negocio y contenido de tus páginas. Facturación: gestionada por el proveedor de pagos; no almacenamos números de tarjeta. Uso: métricas agregadas de visitas y clics de tus páginas. Conexión con pasarelas de cobro: credenciales cifradas.</P>
      <H2>Para qué y con qué base</H2>
      <P>Prestar el servicio (ejecución del contrato), seguridad y prevención de abuso (interés legítimo), obligaciones fiscales y legales, y medición de visitas con cookies solo si lo aceptas (consentimiento).</P>
      <H2>Con quién compartimos datos</H2>
      <P>Proveedores necesarios para operar: alojamiento (Vercel), base de datos y autenticación (Supabase), envío de correo (Resend) y pagos (Stripe, Mercado Pago, Redsys según lo que elija cada cliente). Algunos están fuera de tu país; se aplican las garantías contractuales correspondientes.</P>
      <H2>Conservación</H2>
      <P>Mientras mantengas la cuenta y el tiempo exigido por la ley después. Puedes pedir la eliminación de tu cuenta en cualquier momento.</P>
      <H2>Tus derechos</H2>
      <P>Acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a hola@linkhub.johelpastorino.com. Puedes reclamar ante la autoridad de protección de datos de tu país (en España, la AEPD).</P>
    </LegalShell>
  )
}
