# Modelo de amenazas (STRIDE, resumido)

| Área | Amenaza | Control | Residual |
|---|---|---|---|
| Autenticación (OTP por email) | S: toma de cuenta por correo comprometido; fuerza bruta de OTP | Supabase Auth; sesión validada con `getUser()` en servidor; redirección `next` saneada | Rate limit de OTP depende de Supabase; MFA no disponible para usuarios |
| Autorización | E/I: IDOR entre inquilinos | RLS por `user_id` + comprobación de propiedad en cada ruta API | Pruebas automáticas multi-tenant pendientes (tests de RLS contra una base real) |
| Contenido de páginas | T/E: XSS almacenado vía URLs o JSON-LD | `sanitizeBlocks`/`sanitizeSettings` al guardar **y** al renderizar; JSON-LD escapado; React escapa texto | CSP de scripts en páginas públicas (estáticas) no aplicada |
| Pagos | T: manipulación de precio; replay de webhook; mezcla de referencias | Precio tomado del servidor y validado; firma + `external_reference` en MP; firma e idempotencia en Stripe | Reembolsos/contracargos solo se reflejan como estado |
| Tokens MP | I: fuga de base de datos | Cifrado AES-256-GCM (clave solo en entorno) | Rotación de clave manual (runbook) |
| Spam público | D: inserciones masivas | Triggers de límite por página (013), RLS sobre páginas publicadas | Sin WAF; DDoS volumétrico depende de Vercel |
| Admin | E/R: abuso de cuenta admin; falta de trazabilidad | Lista `ADMIN_EMAILS`; comprobación en servidor; bitácora `admin_audit_log` | Sin MFA propio: exigir MFA en el correo/IdP del admin |
| Moderación | R: dueño re-publica contenido dado de baja | `moderated_at` + trigger | — |
| Agentes de desarrollo | E: MCP con escritura en producción | `.mcp.json` solo lectura | Revisar permisos de la sesión en cada uso |
| Cadena de suministro | T: dependencia vulnerable | `npm audit` en CI, Dependabot, lockfile | Acciones de CI fijadas por tag, no por SHA |
