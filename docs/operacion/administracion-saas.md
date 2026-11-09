# Cómo se administra LinkHub (guía del dueño de la plataforma)

> Actualiza este documento cuando cambie un panel, una variable o un procedimiento (ver "Política de documentación" en `AGENTS.md`).

## 1. Acceso de administrador
- El panel está en **`/admin`**. Entra solo quien figure en la variable de entorno `ADMIN_EMAILS` (lista separada por comas, sin distinguir mayúsculas).
- **Tu cuenta:** define en Vercel `ADMIN_EMAILS=johelpastorino@gmail.com` (Production y Staging) y vuelve a desplegar. Después inicia sesión en la web con ese email (llega un enlace mágico) y aparecerá "Administración" en el menú.
- Cualquier otra persona que abra `/admin` ve un 404 (no se revela que existe). No hay contraseñas de administrador: la seguridad depende de la **cuenta de correo**, así que activa verificación en dos pasos en Gmail.
- Todas las acciones de administración quedan registradas (menú **Auditoría**).

## 2. Los paneles
| Panel | Ruta | Para qué sirve |
|---|---|---|
| Resumen | `/admin` | Clientes, planes, MRR estimado, páginas y visitas. |
| Clientes | `/admin/users` y `/admin/users/{id}` | Buscar clientes, ver su ficha (plan, páginas, pasarelas, funciones activas), **cambiar plan**, **suspender / reactivar**. |
| Páginas | `/admin/pages` | Moderar: despublicar cualquier página (el dueño no podrá volver a publicarla hasta que tú la restaures). |
| Cobros | `/admin/payments` | Todos los pagos de todos los clientes, filtros, tasa de rechazo, errores y avisos de las pasarelas. |
| Funciones | `/admin/features` | **Despliegue gradual**: activar una función para clientes puntuales, un porcentaje o todos. |
| Auditoría | `/admin/audit` | Quién hizo qué y cuándo. |
| Sistema | `/admin/system` | Estado de la base de datos, migraciones aplicadas y variables de entorno que faltan (nunca muestra valores). |

Monitoreo externo: apunta un servicio de uptime (UptimeRobot, Better Stack) a **`/api/health`** (200 = todo bien, 503 = base de datos caída).

## 3. Rutinas recomendadas
**Cada día (5 min)**
- `/admin/system`: ¿todo en verde? ¿falta alguna variable o migración?
- `/admin/payments`: ¿hay avisos/errores nuevos o una tasa de rechazo anormal?

**Cada semana (20 min)**
- `/admin`: altas, conversiones a Pro, páginas publicadas.
- `/admin/features`: ¿hay una función en piloto lista para ampliar?
- Revisar tickets/emails a `hola@linkhub.app`.

**Cada mes**
- Revisar `npm audit` y los PR de Dependabot; actualizar dependencias.
- Revisar usuarios con plan Pro "regalado" (lanzamiento) y decidir su continuidad.
- Probar una restauración de backup (ver `docs/operacion/entornos-y-despliegue.md`).
- Revisar `/admin/audit` por acciones inesperadas.

## 4. Procedimientos de soporte
- **Dar Pro gratis a un cliente (lanzamiento):** Clientes → ficha → Plan → Pro.
- **Cliente no puede pagar / pago fallido:** Stripe reintenta; tras 7 días (variable `BILLING_GRACE_DAYS`) su página pasa a "en pausa" (muestra una pantalla neutra, sin mencionar el pago) y deja de aceptar pedidos y cobros. Su panel sigue accesible, con un aviso, para que actualice su tarjeta desde "Plan". Al regularizar, la página vuelve sola.
- **Contenido inapropiado:** Páginas → despublicar. Si es grave: Clientes → Suspender (bloquea el login y despublica todo).
- **Un cobro "no llegó":** Cobros → buscar por email o ID → ver detalle: estado, eventos de la pasarela y errores. El cliente ve lo mismo en su "Historial de cobros".
- **Activar una función para un cliente piloto:** Funciones → la función → "Clientes puntuales" → email → Activar.

## 5. Facturación de la plataforma (suscripciones)
- Las suscripciones Pro se cobran con **Stripe** (internacional, multimoneda): precios por moneda en las variables `STRIPE_PRICE_ID_PRO_EUR`, `_USD`, `_MXN` (y `STRIPE_PRICE_ID_PRO` como respaldo en euros). Importes propuestos en `src/lib/pricing.ts` (confírmalos antes de lanzar).
- Los cobros de los clientes a sus propios clientes **no** pasan por tu Stripe: usan su pasarela (Mercado Pago, Stripe Connect, Redsys).
- **Pendiente: fiscalidad** (IVA/OSS en la UE, facturación electrónica en España, AFIP en Argentina, SAT en México). Decidir con un asesor antes de cobrar a escala.

## 6. Qué NO puedes hacer desde el panel (a propósito)
- Ver claves de pasarela de los clientes (están cifradas y no se muestran).
- Editar la auditoría.
- Leer datos personales de compradores fuera de los pagos.

## 7. Contactos y responsabilidades
Completa con tu equipo: responsable técnico, responsable de soporte, contacto del asesor legal/fiscal, canal de incidentes.
