# Excepciones y riesgos aceptados

| ID | Riesgo | Justificación | Aprobador | Caduca |
|---|---|---|---|---|
| EX-001 | `style-src 'unsafe-inline'` en la CSP del panel | La app usa estilos en línea (React `style=`) en todo el producto; migrarlos a clases es un proyecto aparte | owner | 2027-05-06 |
| EX-002 | Páginas públicas sin CSP de `script-src` | Son estáticas (ISR); un nonce obligaría a render dinámico y empeoraría rendimiento/SEO. Mitigación: saneo de entrada y salida, `object-src 'none'`, `base-uri 'self'` | owner | 2027-02-06 |
| EX-003 | Admin identificado por lista de emails sin MFA propio | Un solo operador; exigir MFA en la cuenta de correo | owner | 2027-02-06 |
| EX-004 | Acciones de CI fijadas por tag y no por SHA | Dependabot de GitHub Actions activado; fijar por SHA al estabilizar el flujo | owner | 2027-02-06 |
