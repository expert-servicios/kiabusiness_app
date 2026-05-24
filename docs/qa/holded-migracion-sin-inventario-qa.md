# QA — Migración a Holded sin Inventario

Casos de prueba para validar que Kia, la landing y el flujo de contratación se comportan correctamente.

---

## Casos de comportamiento de Kia

### CA-01 — Usuario no tiene Holded
**Escenario:** El usuario dice "no tengo cuenta de Holded" o "acabo de crear una empresa".

**Esperado:**
- Kia explica que la migración sí requiere una cuenta activa de Holded.
- Kia ofrece CTA prueba gratuita Holded 14 días.
- Kia puede sugerir Pack Starter como paso previo si la cuenta necesita configuración inicial.
- Kia NO bloquea definitivamente, pero indica que el acceso a Holded es necesario antes de iniciar la migración.

**No esperado:**
- Kia dice que puede contratar sin tener Holded (eso es Pack Starter, no Migración).
- Kia bloquea por completo la conversación sin dar alternativas.

---

### CA-02 — Usuario ya tiene Holded
**Escenario:** El usuario dice "ya tengo Holded" o "tengo cuenta activa".

**Esperado:**
- Kia continúa el readiness sin preocuparse por la cuenta.
- Kia pregunta por el sistema de origen y el volumen de datos.

---

### CA-03 — Usuario tiene inventario
**Escenario:** El usuario dice "tengo 800 referencias de producto con stock en almacén".

**Esperado:**
- Kia detecta inventario y redirige a Migración con inventario.
- Kia NO ofrece Migración sin inventario como solución para el catálogo de productos.

---

### CA-04 — Usuario quiere migrar desde ContaPlus
**Escenario:** El usuario dice "tengo 3 años de facturas en ContaPlus que quiero pasar a Holded".

**Esperado:**
- Kia identifica ContaPlus como sistema compatible.
- Kia pregunta si los datos se pueden exportar en CSV o Excel.
- Kia explica el proceso de migración.
- Kia menciona el precio: 899 € + IVA.

---

### CA-05 — Usuario tiene volumen elevado (>10.000 registros)
**Escenario:** El usuario dice "tengo 15.000 facturas de los últimos 5 años".

**Esperado:**
- Kia detecta que el volumen es elevado.
- Kia recomienda una llamada previa para valorar el alcance antes de confirmar el precio.
- Kia NO confirma automáticamente 899 € sin revisar el alcance.

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

### CA-07 — Usuario pregunta por el precio
**Escenario:** El usuario pregunta "¿cuánto cuesta migrar las facturas a Holded?".

**Esperado:**
- Kia responde con el precio: 899 € + IVA.
- Kia ofrece el enlace de la landing.
- Kia menciona que para volúmenes grandes puede requerir valoración previa.

---

### CA-08 — Usuario quiere solo configuración, no migración
**Escenario:** El usuario dice "solo quiero configurar Holded, no tengo facturas antiguas que importar".

**Esperado:**
- Kia detecta que el servicio adecuado es Pack Starter (499 € + IVA), no Migración.
- Kia explica la diferencia entre Pack Starter y Migración.

---

### CA-09 — Readiness: usuario no tiene Holded (holded_trial)
**Escenario:** En el readiness, el usuario selecciona "No tengo cuenta de Holded todavía".

**Esperado:**
- La opción mapea a `holded_trial`.
- El modal muestra que es necesaria una cuenta activa antes de iniciar la migración.
- canCheckout = false para este resultado (a diferencia de Pack Starter).
- El usuario recibe la CTA de prueba gratuita Holded.

---

### CA-10 — Readiness: usuario tiene inventario (blocking)
**Escenario:** En el readiness, el usuario selecciona "Sí, tengo productos y stock".

**Esperado:**
- La opción es blocking.
- El resultado es request_quote.
- El modal recomienda Migración con inventario.
- canCheckout = false para este resultado.

---

### CA-11 — Readiness: usuario tiene sistema origen incompatible
**Escenario:** En el readiness, el usuario indica que usa un sistema que no permite exportar datos.

**Esperado:**
- Kia identifica que el sistema no exporta fácilmente.
- Kia recomienda una llamada para valorar alternativas.
- El resultado puede ser book_call.

---

### CA-12 — Readiness: usuario tiene datos exportados y Holded activo
**Escenario:** Usuario tiene Holded activo, datos en Excel listos y volumen estándar (<10.000 registros, <3 años).

**Esperado:**
- Todas las respuestas mapean a continue_checkout.
- El modal muestra "¡Estás listo para contratar!" o equivalente.
- canCheckout = true.
- El usuario puede continuar a la cesta.

---

## Casos de landing page

### LP-01 — Ruta accesible
**URL:** `/holded/migracion-sin-inventario`

**Esperado:**
- La página carga sin errores.
- Título de página: "Migración a Holded sin Inventario: importar facturas y datos históricos | EXPERT".
- Se muestran todas las secciones: hero, para quién, qué incluye, qué no incluye, proceso, datos, resultado, FAQ, artículos, CTA.

---

### LP-02 — CTA principal lleva a precios
**Esperado:**
- El botón "Preparar contratación — 899 € + IVA" enlaza a `/holded#precios`.
- El usuario puede seleccionar Migración sin inventario y abrir el readiness modal.

---

### LP-03 — CTA secundario abre prueba Holded
**Esperado:**
- El botón "Solicitar prueba Holded 14 días" enlaza a `https://www.holded.com/es/precios`.
- El enlace abre en nueva pestaña.

---

### LP-04 — Artículos relacionados visibles
**Esperado:**
- Se muestran los 3 artículos relacionados: `migrar-contaplus-a-holded`, `holded-migracion-sin-inventario-guia`, `pack-starter-holded-vs-migracion`.
- Cada artículo enlaza a su ruta de blog `/blog/<slug>`.

---

### LP-05 — Enlace a Migración con inventario en CTA final
**Esperado:**
- El CTA final incluye un enlace "Ver Migración con inventario" que lleva a `/holded/migracion-con-inventario`.

---

## Casos de HoldedPricingSection

### PS-01 — Migración sin inventario muestra enlace "Ver detalles del servicio"
**Esperado:**
- La card de Migración sin inventario muestra un enlace "Ver detalles del servicio →".
- El enlace lleva a `/holded/migracion-sin-inventario`.

---

### PS-02 — Readiness se abre al seleccionar Migración sin inventario y hacer clic en añadir
**Esperado:**
- Al seleccionar la card y hacer clic en "Añadir a la cesta", se abre ReadinessModal con las preguntas de Migración sin inventario.
- La primera pregunta es "¿Ya tienes cuenta activa de Holded?".

---

### PS-03 — No se rompe carrito ni checkout
**Esperado:**
- Después de aprobar readiness, Migración sin inventario se añade al carrito correctamente.
- El checkout procesa el priceId `price_1SxNJcLeYwwgvux42XH9HxiJ`.

---

## Checklist de criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Existe landing `/holded/migracion-sin-inventario` | ✓ |
| 2 | Existe ficha knowledge base en `lib/data/kia-knowledge/` | ✓ |
| 3 | Existe readiness específico con 6 preguntas | ✓ |
| 4 | Kia usa readiness, nunca viabilidad | ✓ (flowType: readiness) |
| 5 | Migración sin inventario SÍ requiere Holded activo para la migración | ✓ (holded_trial si no tiene) |
| 6 | Migración sin inventario no exige API key | ✓ (kiaRules) |
| 7 | Si no tiene Holded, ofrece prueba gratuita y lo orienta | ✓ (nextAction: holded_trial) |
| 8 | Si hay inventario, deriva a Migración con inventario | ✓ (blocking: true + request_quote) |
| 9 | Volumen elevado redirige a llamada | ✓ (book_call) |
| 10 | Blog tiene 3 artículos relacionados | ✓ |
| 11 | QA documentado | ✓ |
| 12 | HoldedPricingSection no se rompe | ✓ |
| 13 | Carrito no se rompe | ✓ |
| 14 | Checkout no se rompe | ✓ |
| 15 | Kia Engine reconoce `svc_holded_migracion_sin_inventario` | Pendiente de verificar |
