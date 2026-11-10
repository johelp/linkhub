# Pedidos con comandas, cobro de pedidos y agenda sincronizada

Estado actual: los pedidos (`order_menu`) y las solicitudes de cita (`appointment_request`) **solo se envían por WhatsApp**; la plataforma no guarda nada, así que no hay panel de comandas ni calendario. Esta nota propone cómo cerrarlo, por fases. Nada de esto está construido todavía.

## Fase A · Panel de comandas (pedidos guardados)
- Tabla `orders` (migración nueva): `page_id`, `block_id`, número correlativo por página, líneas (nombre, cantidad, precio **recalculado en el servidor** desde el bloque, nunca el del navegador), total, moneda, entrega/retiro, dirección, nombre, notas, `status` (nuevo → en preparación → listo → entregado / cancelado), `payment_status`, fechas. RLS: el dueño lee y actualiza estado; el público solo inserta por una ruta del servidor con límite de frecuencia y antiabuso.
- Flujo público: al pulsar «Enviar pedido» se guarda primero (`POST /api/orders`) y el mensaje de WhatsApp lleva «Pedido #N». Si guardar falla, se abre WhatsApp igualmente (no se pierde la venta).
- Panel `/dashboard/orders`: columnas por estado, actualización automática cada pocos segundos, aviso sonoro opcional, botón «Responder por WhatsApp», historial y exportación CSV. Solo aparece si la página tiene el bloque de pedidos o de carta.
- Flag `orders_panel` (apagado por defecto).

## Fase B · Cobrar los pedidos online
- En el bloque de pedidos, opción «Cobrar online» disponible si el dueño tiene una pasarela conectada (Mercado Pago, Stripe o Redsys). Opciones: pagar ahora, pagar al recibir, o elegir el cliente.
- El cobro se crea **desde el pedido guardado** (importe del servidor), con la misma lógica de `/api/pay/*` y sus webhooks; al confirmarse el pago, `orders.payment_status` pasa a «pagado» y la comanda lo muestra. El mensaje de WhatsApp indica «pagado» o «pendiente».
- Depende de la Fase A.

## Fase C · Calendario de citas
- Tabla `appointments` (solicitudes guardadas): servicio, día/hora, duración, cliente, teléfono, notas, `status` (solicitada → confirmada / rechazada / cancelada).
- Panel `/dashboard/calendar`: vista semana/agenda, confirmar o rechazar con un clic y avisar al cliente por WhatsApp. Un hueco confirmado deja de ofrecerse en la página (se acabaron los dobles reservas).
- **iCal (suscripción):** enlace secreto `/api/calendar/<token>.ics` que Google Calendar, Apple Calendar u Outlook pueden suscribir. Es de solo lectura (de LinkHub hacia tu calendario) y se puede regenerar el token.
- **Bloqueos desde tu calendario:** pegar la URL iCal de un calendario externo para ocultar los huecos en los que ya estás ocupado. Requiere lectura segura de URLs externas (solo https, límite de tamaño y tiempo, sin acceso a direcciones internas).
- **Google Calendar en dos sentidos** (crear y leer eventos con tu cuenta) necesita una aplicación OAuth verificada por Google: se deja para una fase posterior.

## Orden recomendado
A → C (iCal y panel) → B → Google Calendar en dos sentidos. Antes de empezar hay que decidir: cuánto tiempo se conservan los pedidos y las citas (datos personales de clientes finales), y si el aviso al cliente por WhatsApp es manual (un enlace) o automático (requiere WhatsApp Business API, de pago).
