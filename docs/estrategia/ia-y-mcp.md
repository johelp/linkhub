# IA, asistentes y MCP: qué construir y en qué orden

## 1. Opinión
Hay cuatro capas, de más a menos rentable a corto plazo:

1. **Capa pública legible por máquinas (hecha).** Datos estructurados, `llms.txt` por página y de plataforma, `facts.json`, FAQ y robots que permiten a rastreadores de IA. Es lo que hace que ChatGPT, Gemini, Perplexity o Claude puedan **encontrar y citar** a tus clientes. Coste mínimo, efecto universal.
2. **MCP público de solo lectura + acciones "con humano en el bucle" (en construcción).** Un asistente puede consultar un negocio (servicios, horario, FAQ), ver disponibilidad y **preparar** una cita o un pedido: devuelve un enlace de WhatsApp con el mensaje listo; nada se envía ni guarda sin que la persona lo confirme. Es seguro, útil y diferencial ("reserva con tu asistente de IA").
3. **MCP/API del cliente (autenticado, por claves).** Permite a un cliente conectar su propio chatbot o automatización: leer y editar su página y su base de conocimiento, consultar analíticas y cobros (solo lectura). Es lo que convierte a LinkHub en **plataforma** (integraciones propias). Riesgo mayor: alcances (scopes), auditoría y límites estrictos. Se despliega **por invitación** con un flag.
4. **Asistente de IA dentro de la página del cliente (chatbot).** Responde a visitantes usando solo la base de conocimiento y deriva a WhatsApp. Coste variable por mensaje (modelo de IA): conviene como **complemento de pago** con tope de mensajes. Es la última capa: necesita barreras (solo responde con datos del negocio), límites y moderación.

## 2. Qué decisiones pide cada capa
- **Privacidad:** lo público es público; lo privado de la base de conocimiento solo sale por la API autenticada del propio dueño.
- **Inyección de instrucciones:** el texto de las páginas es *contenido no confiable*; las herramientas MCP lo devuelven marcado como datos, nunca como instrucciones.
- **Costes:** el MCP público no usa modelos (solo datos) → coste ≈ 0. El chatbot sí → límites por plan.
- **Marca/atribución:** los enlaces que generan los asistentes llevan UTM (`utm_source=ai_assistant`) para medir el canal.

## 3. Hoja de ruta
1. (Hecho) Capa 1.
2. (Agente en curso) Capa 2 y 3: endpoint MCP, claves de API con scopes, página "Desarrolladores", documentación en `docs/developers/`.
3. Medir: visitas desde asistentes (UTM/referrer), solicitudes generadas por MCP.
4. Capa 4 como complemento: widget de chat con base de conocimiento, límites por plan y panel de conversaciones.

## 4. Documentación
La guía técnica (herramientas, scopes, ejemplos de conexión) vive en `docs/developers/mcp.md`, mantenida junto al código.
