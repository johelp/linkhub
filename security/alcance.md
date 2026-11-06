# Alcance (ficha de trabajo)

- **APP Y REPOSITORIOS:** `johelp/linkhub` (Next.js 16 App Router + Supabase). Rama de trabajo `claude/trusting-rubin-sqp9cg`.
- **OBJETIVO:** auditar y corregir lo necesario (autorizado por la persona responsable en el pedido original).
- **ENTORNOS Y ACCESO:** solo código del repositorio, en rama separada. **Sin acceso** a producción, a Supabase (el MCP no conectó: `ERR_PROXY_TUNNEL`) ni a Vercel.
- **STACK:** Next.js 16.3.4 → 16.4.5, React 19.2, Supabase (Auth, Postgres+RLS, Storage), Stripe, Mercado Pago (OAuth/Checkout Pro), Resend, Zustand.
- **HOSTING:** Vercel (`vercel.json`). Infraestructura compartida no verificada.
- **DATOS:** emails de suscriptores y compradores, tokens OAuth de Mercado Pago, pagos/entradas. Sin datos de tarjeta (pasarelas alojadas).
- **JURISDICCIONES:** AR/LatAm/UE (idiomas ES/EN/PT/FR/DE/IT). Normativa exacta: **NO VERIFICADO** — requiere asesoría legal.
- **ARQUITECTURA:** multi-tenant por `user_id` + RLS.
- **IA:** el producto no usa modelos. Se desarrolla con agentes de código (`.mcp.json` con Supabase MCP).
- **MARCOS:** SOC 2 (Security, Confidentiality, Availability) · ISO 27001:2022 · ASVS L2 (recomendado, no confirmado).
- **RESPONSABLE Y APROBADOR:** johelpastorino@gmail.com (único mantenedor → controles compensatorios necesarios).
- **AUTORIZADO:** cambios de código en rama + migración SQL como archivo (sin aplicarla).
- **REQUIERE APROBACIÓN:** aplicar la migración 011, rotar secretos, cambios en Vercel/Supabase, merge a `main`.
- **SUPUESTOS:** la entrevista interactiva se resumió porque el pedido ya fijaba objetivo y autorización; los demás campos se infirieron del repositorio. **Confirmar o corregir.**
