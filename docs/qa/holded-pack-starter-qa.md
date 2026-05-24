# QA — Holded Pack Starter / Onboarding a Holded

Casos de prueba para validar que Kia, la landing y el flujo de contratación se comportan correctamente.

---

## Casos de comportamiento de Kia

### CA-01 — Usuario no tiene Holded
**Escenario:** El usuario dice "no tengo cuenta de Holded" o "acabo de crear una empresa".

**Esperado:**
- Kia explica que NO es necesario tener Holded para contratar Pack Starter.
- Kia ofrece CTA prueba gratuita Holded 14 días.
- Kia permite continuar con Pack Starter.
- Kia NO bloquea ni rechaza la contratación.

**No esperado:**
- Kia dice "primero necesitas Holded para contratar".
- Kia redirige únicamente a Holded sin mencionar Pack Starter.

---

### CA-02 — Usuario ya tiene Holded
**Escenario:** El usuario dice "ya tengo Holded" o "tengo cuenta activa".

**Esperado:**
- Kia continúa readiness sin preocuparse por la cuenta.
- Kia explica que Pack Starter configura o ajusta la cuenta existente.

---

### CA-03 — Usuario quiere migrar facturas históricas
**Escenario:** El usuario dice "tengo 3 años de facturas en ContaPlus / Excel / Sage que quiero pasar a Holded".

**Esperado:**
- Kia detecta que el alcance excede Pack Starter.
- Kia recomienda Migración sin inventario.
- Kia NO ofrece Pack Starter como solución para migración histórica.

---

### CA-04 — Usuario tiene inventario
**Escenario:** El usuario dice "tenemos 800 referencias de producto con stock en almacén".

**Esperado:**
- Kia detecta inventario y redirige a Migración con inventario.
- Kia puede mencionar Pack Starter solo como paso previo si corresponde, pero NO lo ofrece como servicio para inventario.

---

### CA-05 — Usuario quiere plan mensual
**Escenario:** El usuario dice "quiero gestión mensual" o "quiero que llevéis mi contabilidad mensualmente".

**Esperado:**
- Kia explica la diferencia entre Pack Starter (configuración puntual) y planes mensuales (gestión recurrente).
- Kia explica que los planes mensuales requieren Holded conectado.
- Kia puede sugerir Pack Starter como paso previo si el usuario no tiene Holded configurado.

---

### CA-06 — Usuario quiere pasar API key por WhatsApp
**Escenario:** El usuario dice "te paso mi API key de Holded" o Kia solicita la API key en el chat.

**Esperado:**
- Kia rechaza recibir la API key por WhatsApp.
- Kia explica que el acceso técnico se gestiona desde el portal seguro.
- Kia NO registra ni solicita API keys en mensajes.

**No esperado:**
- Kia acepta, repite o solicita API keys en el chat.

---

### CA-07 — Usuario pregunta qué documentos necesita
**Escenario:** El usuario pregunta "qué documentos tengo que enviar para Pack Starter".

**Esperado:**
- Kia responde que para Pack Starter casi todo son datos, no documentos.
- Kia lista los datos obligatorios (NIF, razón social, dirección fiscal, etc.).
- Kia menciona que los documentos son opcionales (036/037, escritura, logo, etc.).
- Kia NO pide documentos pesados de entrada.

---

### CA-08 — Usuario pulsa "Otro" en quick replies
**Escenario:** Kia presenta opciones (Pack Starter / Prueba 14 días / Migración / Otro) y el usuario selecciona "Otro".

**Esperado:**
- Kia pide al usuario que describa su caso con texto libre.
- Kia no vuelve a ofrecer las mismas opciones inmediatamente.

---

### CA-09 — Usuario pregunta por el precio
**Escenario:** El usuario pregunta "¿cuánto cuesta configurar Holded?" o "¿qué precio tiene Pack Starter?".

**Esperado:**
- Kia responde con el precio: 499 € + IVA.
- Kia ofrece el enlace de la landing o de la sección de precios.
- Kia ofrece CTA para contratar o para llamada si hay dudas.

---

### CA-10 — Usuario intenta hacer checkout
**Escenario:** El usuario quiere contratar Pack Starter.

**Esperado:**
- Se requiere login.
- Se requiere perfil completo (profile_completed).
- Se requiere billing_ready.
- Se muestra readiness check antes de añadir a cesta.
- NO se requiere Holded conectado.
- NO se requiere API key.

---

### CA-11 — Readiness: usuario tiene migración + inventario (blocking)
**Escenario:** En el readiness, el usuario selecciona "Sí, tengo inventario / almacenes / stock".

**Esperado:**
- La opción es blocking.
- El resultado es request_quote.
- El modal muestra "Solicita un presupuesto personalizado" y recomienda Migración con inventario.
- canCheckout = false para este resultado.

---

### CA-12 — Readiness: usuario no tiene Holded (no blocking)
**Escenario:** En el readiness, el usuario selecciona "No tengo cuenta — me podéis ayudar a empezar".

**Esperado:**
- La opción mapea a `continue_checkout`.
- El modal muestra "¡Estás listo para contratar!" o resultado equivalente.
- canCheckout = true.
- El usuario puede continuar a la cesta.

---

## Casos de landing page

### LP-01 — Ruta accesible
**URL:** `/holded/pack-starter`

**Esperado:**
- La página carga sin errores.
- Título de página: "Pack Starter Holded: configuración inicial y onboarding | EXPERT".
- Se muestran todas las secciones: hero, para quién, qué incluye, qué no incluye, proceso, datos, resultado, FAQ, artículos, CTA.

---

### LP-02 — CTA principal lleva a precios
**Esperado:**
- El botón "Preparar contratación — 499 € + IVA" enlaza a `/holded#precios`.
- El usuario puede seleccionar Pack Starter y abrir el readiness modal.

---

### LP-03 — CTA secundario abre prueba Holded
**Esperado:**
- El botón "Solicitar prueba Holded 14 días" enlaza a `https://www.holded.com/es/precios`.
- El enlace abre en nueva pestaña.

---

### LP-04 — Artículos relacionados visibles
**Esperado:**
- Se muestran los 3 artículos relacionados: `como-empezar-con-holded`, `holded-autonomos-pequenas-empresas`, `pack-starter-holded-vs-migracion`.
- Cada artículo enlaza a su ruta de blog `/blog/<slug>`.

---

### LP-05 — Sección "Qué no incluye" menciona servicios alternativos
**Esperado:**
- Cada ítem de "no incluye" con alternativa muestra el servicio correcto (Migración sin inventario, Migración con inventario, etc.).

---

## Casos de HoldedPricingSection

### PS-01 — Pack Starter muestra enlace "Ver detalles del servicio"
**Esperado:**
- La card de Pack Starter muestra un enlace "Ver detalles del servicio →".
- El enlace lleva a `/holded/pack-starter`.
- Las otras cards NO muestran este enlace (todavía).

---

### PS-02 — Readiness se abre al seleccionar Pack Starter y hacer clic en añadir
**Esperado:**
- Al seleccionar Pack Starter y hacer clic en "Añadir a la cesta", se abre ReadinessModal con las 6 preguntas del check actualizado.
- La primera pregunta es "¿Ya tienes cuenta activa de Holded?".

---

### PS-03 — No se rompe carrito ni checkout
**Esperado:**
- Después de aprobar readiness, Pack Starter se añade al carrito correctamente.
- El checkout procesa el priceId `price_1SxNObLeYwwgvux4fLN9k8YG`.

---

## Checklist de criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Existe landing `/holded/pack-starter` | ✓ |
| 2 | Existe ficha knowledge base en `lib/data/kia-knowledge/` | ✓ |
| 3 | Existe readiness específico con 6 preguntas | ✓ |
| 4 | Kia usa readiness, nunca viabilidad | ✓ (flowType: readiness) |
| 5 | Pack Starter no exige Holded conectado para checkout | ✓ (allowsCheckoutWithoutHoldedAccount: true) |
| 6 | Pack Starter no exige API key | ✓ (kiaRules) |
| 7 | Si no tiene Holded, ofrece prueba gratuita y permite contratar | ✓ (nextAction: continue_checkout) |
| 8 | Si hay migración / inventario, deriva al servicio correcto | ✓ (blocking: true + request_quote) |
| 9 | Datos y documentos mínimos definidos en checklist y knowledge base | ✓ |
| 10 | Blog tiene 3 artículos relacionados | ✓ |
| 11 | QA documentado | ✓ |
| 12 | HoldedPricingSection no se rompe | ✓ |
| 13 | Carrito no se rompe | ✓ |
| 14 | Checkout no se rompe | ✓ |
| 15 | Kia Engine ya tiene `svc_holded_starter` y flujo `holded` configurado | ✓ (preexistente) |
