# QA — Migración a Holded con Inventario

Casos de prueba para validar que Kia, la landing y el flujo de contratación se comportan correctamente.

---

## Casos de comportamiento de Kia

### CA-01 — Usuario no tiene Holded
**Escenario:** El usuario dice "no tengo cuenta de Holded".

**Esperado:**
- Kia explica que la migración requiere una cuenta activa de Holded.
- Kia ofrece CTA prueba gratuita Holded 14 días.
- Kia puede sugerir Pack Starter como paso previo para configurar la cuenta.
- Kia NO permite continuar directamente a checkout sin Holded.

---

### CA-02 — Usuario ya tiene Holded
**Escenario:** El usuario dice "ya tengo Holded" o "tengo cuenta activa".

**Esperado:**
- Kia continúa el readiness.
- Kia pregunta por el número de referencias y si hay variantes.

---

### CA-03 — Usuario no tiene inventario (solo facturas)
**Escenario:** El usuario dice "tengo facturas pero no tengo productos con stock".

**Esperado:**
- Kia detecta que el servicio correcto es Migración sin inventario (899 € + IVA).
- Kia NO ofrece Migración con inventario para alguien sin catálogo de productos.

---

### CA-04 — Usuario tiene catálogo grande (>2.000 referencias)
**Escenario:** El usuario dice "tenemos 3.500 referencias de producto".

**Esperado:**
- Kia detecta que el volumen excede el estándar.
- Kia recomienda una llamada previa para valorar el alcance.
- Kia NO confirma automáticamente 1.199 € sin revisar el alcance.

---

### CA-05 — Usuario tiene variantes complejas
**Escenario:** El usuario dice "cada producto tiene muchas variantes de talla y color".

**Esperado:**
- Kia detecta variantes complejas.
- Kia recomienda llamada previa para valorar el alcance.

---

### CA-06 — Usuario tiene múltiples almacenes
**Escenario:** El usuario dice "tenemos 3 almacenes en distintas ubicaciones".

**Esperado:**
- Kia identifica múltiples almacenes como factor de complejidad.
- Kia recomienda llamada previa para valorar el alcance.

---

### CA-07 — Usuario quiere sincronizar con tienda online
**Escenario:** El usuario dice "quiero que el inventario de Holded se sincronice con mi WooCommerce".

**Esperado:**
- Kia aclara que la migración deja el inventario en Holded pero la sincronización continua requiere módulo de integración adicional.
- Kia NO promete sincronización automática como parte de Migración con inventario.

---

### CA-08 — Usuario quiere pasar API key por WhatsApp
**Escenario:** El usuario dice "te paso mi API key de Holded" o Kia solicita la API key en el chat.

**Esperado:**
- Kia rechaza recibir la API key por WhatsApp.
- Kia explica que el acceso técnico se gestiona desde el portal seguro.

**No esperado:**
- Kia acepta, repite o solicita API keys en el chat.

---

### CA-09 — Usuario pregunta por el precio
**Escenario:** El usuario pregunta "¿cuánto cuesta migrar el inventario a Holded?".

**Esperado:**
- Kia responde con el precio: 1.199 € + IVA.
- Kia ofrece el enlace de la landing.
- Kia menciona que para catálogos grandes puede requerir valoración previa.

---

### CA-10 — Readiness: usuario no tiene Holded (holded_trial)
**Escenario:** En el readiness, el usuario selecciona "No tengo cuenta de Holded todavía".

**Esperado:**
- La opción mapea a `holded_trial`.
- El modal muestra que es necesaria una cuenta activa antes de iniciar la migración.
- canCheckout = false para este resultado.
- El usuario recibe la CTA de prueba gratuita Holded.

---

### CA-11 — Readiness: catálogo grande (blocking para book_call)
**Escenario:** El usuario selecciona "más de 2.000 referencias" en el readiness.

**Esperado:**
- El resultado es book_call.
- canCheckout = false.
- El modal recomienda llamada de valoración.

---

### CA-12 — Readiness: variantes complejas (book_call)
**Escenario:** El usuario selecciona "muchas variantes por producto".

**Esperado:**
- El resultado puede ser book_call.
- El modal recomienda llamada de valoración.

---

### CA-13 — Readiness: datos exportables y Holded activo y catálogo estándar
**Escenario:** Usuario tiene Holded activo, catálogo en Excel listo, <2.000 referencias, sin variantes complejas, almacén único.

**Esperado:**
- Todas las respuestas mapean a continue_checkout.
- El modal muestra "¡Estás listo para contratar!" o equivalente.
- canCheckout = true.
- El usuario puede continuar a la cesta.

---

## Casos de landing page

### LP-01 — Ruta accesible
**URL:** `/holded/migracion-con-inventario`

**Esperado:**
- La página carga sin errores.
- Título de página: "Migración a Holded con Inventario: catálogo, variantes y stock | EXPERT".
- Se muestran todas las secciones: hero, para quién, qué incluye, qué no incluye, proceso, datos, resultado, FAQ, artículos, CTA.

---

### LP-02 — CTA principal lleva a precios
**Esperado:**
- El botón "Preparar contratación — 1.199 € + IVA" enlaza a `/holded#precios`.
- El usuario puede seleccionar Migración con inventario y abrir el readiness modal.

---

### LP-03 — CTA secundario abre prueba Holded
**Esperado:**
- El botón "Solicitar prueba Holded 14 días" enlaza a `https://www.holded.com/es/precios`.
- El enlace abre en nueva pestaña.

---

### LP-04 — Artículos relacionados visibles
**Esperado:**
- Se muestran los 3 artículos relacionados: `holded-inventario-guia-completa`, `migrar-inventario-a-holded`, `pack-starter-holded-vs-migracion`.
- Cada artículo enlaza a su ruta de blog `/blog/<slug>`.

---

### LP-05 — Enlace a Migración sin inventario en CTA final
**Esperado:**
- El CTA final incluye un enlace "Ver Migración sin inventario" que lleva a `/holded/migracion-sin-inventario`.

---

## Casos de HoldedPricingSection

### PS-01 — Migración con inventario muestra enlace "Ver detalles del servicio"
**Esperado:**
- La card de Migración con inventario muestra un enlace "Ver detalles del servicio →".
- El enlace lleva a `/holded/migracion-con-inventario`.

---

### PS-02 — Readiness se abre al seleccionar Migración con inventario y hacer clic en añadir
**Esperado:**
- Al seleccionar la card y hacer clic en "Añadir a la cesta", se abre ReadinessModal con las preguntas de Migración con inventario.
- La primera pregunta es "¿Ya tienes cuenta activa de Holded?".

---

### PS-03 — No se rompe carrito ni checkout
**Esperado:**
- Después de aprobar readiness, Migración con inventario se añade al carrito correctamente.
- El checkout procesa el priceId `price_1SxNLlLeYwwgvux4IjCOgIQl`.

---

## Checklist de criterios de aceptación

| # | Criterio | Estado |
|---|---|---|
| 1 | Existe landing `/holded/migracion-con-inventario` | ✓ |
| 2 | Existe ficha knowledge base en `lib/data/kia-knowledge/` | ✓ |
| 3 | Existe readiness específico con 6 preguntas | ✓ |
| 4 | Kia usa readiness, nunca viabilidad | ✓ (flowType: readiness) |
| 5 | Migración con inventario SÍ requiere Holded activo | ✓ (holded_trial si no tiene) |
| 6 | Migración con inventario no exige API key | ✓ (kiaRules) |
| 7 | Si no tiene Holded, ofrece prueba gratuita y lo orienta | ✓ (nextAction: holded_trial) |
| 8 | Catálogo >2.000 referencias → book_call | ✓ |
| 9 | Variantes complejas → book_call | ✓ |
| 10 | Múltiples almacenes complejos → book_call | ✓ |
| 11 | Blog tiene 3 artículos relacionados | ✓ |
| 12 | QA documentado | ✓ |
| 13 | HoldedPricingSection no se rompe | ✓ |
| 14 | Carrito no se rompe | ✓ |
| 15 | Checkout no se rompe | ✓ |
| 16 | Kia Engine reconoce `svc_holded_migracion_con_inventario` | Pendiente de verificar |
