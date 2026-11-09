# Inicio de sesión (magic link): configuración y diagnóstico

El acceso usa el enlace mágico de Supabase (flujo PKCE). El enlace lleva a `<origen>/auth/callback?code=…`, donde se canjea por la sesión. El `<origen>` es el sitio **desde el que se pidió el enlace** (`window.location.origin`).

## Configuración obligatoria en Supabase
Authentication → URL Configuration:
- **Site URL**: el dominio de producción (hoy `https://linkhub-pi.vercel.app`; cuando exista, el dominio definitivo).
- **Redirect URLs** (permitidas): Supabase solo respeta `emailRedirectTo` si coincide con esta lista. Añade:
  - `https://linkhub-pi.vercel.app/**`
  - `https://*-johelps-projects.vercel.app/**` (todas las previews de Vercel de esta cuenta)
  - `https://linkhub.johelpastorino.com/**` (subdominio de pruebas, cuando exista)
  - `http://localhost:3000/**`

Si la URL no está en la lista, Supabase **ignora** la redirección y manda al Site URL: el síntoma es abrir el enlace y acabar en `https://<producción>/?code=…` (el sitio viejo, sin sesión). Es lo que ocurrió en la primera prueba.

## Otros fallos habituales
| Síntoma | Causa | Solución |
|---|---|---|
| «Se han enviado demasiados correos» / el correo no llega | Supabase limita a ~2 correos/hora con su remitente por defecto | SMTP propio con Resend (`docs/operacion/emails.md`) |
| `/auth?error=verifier` | El enlace se abrió en otro navegador (app del correo) que el que lo pidió: el código PKCE vive en el navegador de origen | Abrir el enlace en el mismo navegador; o usar plantillas con `token_hash` (`/auth/confirm`) |
| `/auth?error=expired` | Enlace caducado o ya usado (algunos buzones lo «previsualizan» y lo consumen) | Pedir otro; considerar `/auth/confirm` |
| `/auth?error=config` | Faltan `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` en ese entorno de Vercel | Definirlas (Preview y Production) y redesplegar. `GET /api/health` muestra `auth: true/false` |

## Comprobación rápida
1. `GET /api/health` → `{"status":"ok","auth":true,…}`.
2. Pedir el enlace desde la URL a probar y comprobar que el enlace del correo empieza por esa misma URL.
