# Plan de identidad multi-entidad y reconciliación Stripe

Fecha: 2026-09-07

## Decisión de negocio confirmada

Un mismo usuario de EXPERT puede gestionar varias entidades fiscales o mercantiles. La identidad de acceso y la identidad de facturación no son la misma cosa.

El caso operativo de referencia confirmó tres reglas generales:

- una misma persona puede gestionar varias entidades jurídicas;
- dos entidades pueden compartir un email de contacto sin compartir identidad fiscal;
- un Stripe Customer puede haber sido reutilizado históricamente entre distintas identidades fiscales.

Los identificadores reales de clientes, CIF/NIF, emails, Stripe Customer/Subscription/Invoice IDs y demás referencias financieras concretas **no deben almacenarse en documentación pública del repositorio**. La evidencia de producción debe consultarse únicamente mediante herramientas internas autorizadas.

## Hallazgo de preflight: Customer reutilizado entre entidades

El preflight de producción confirmó que un mismo Stripe Customer histórico contenía facturas emitidas a más de una identidad fiscal. Por tanto, un Stripe Customer no puede considerarse por sí solo una identidad contable histórica.

El modelo debe distinguir entre:

1. **relación operativa actual empresa ↔ Stripe Customer**;
2. **propietario legal de cada factura histórica**.

Hasta resolver un histórico mixto, el Customer completo debe permanecer bloqueado para mapping global a una sola entidad.

## Modelo canónico

### Persona / acceso

`profiles` + `auth.users` representan a la persona que accede al portal.

### Empresas gestionadas

`profile_companies` representa la relación muchos-a-muchos entre una persona y las entidades que puede gestionar.

Una persona puede gestionar una sociedad, un autónomo, varias sociedades o una combinación de autónomo + una o más sociedades.

`profiles.active_company_id` sólo representa el contexto activo de interfaz. No implica propiedad exclusiva ni atribución de cobros.

### Stripe Customers

`company_stripe_customers` es el mapping explícito entre una `company` y uno o varios Stripe Customer IDs para la relación operativa.

Reglas:

1. Un Stripe Customer sólo puede asignarse a una empresa dentro del mismo tenant cuando su atribución operativa sea inequívoca.
2. Una empresa puede conservar varios Stripe Customers por histórico o migración.
3. Puede existir como máximo un mapping primario activo por empresa.
4. `companies.stripe_customer_id` se mantiene temporalmente como compatibilidad, pero no es el modelo canónico.
5. No se debe inferir la empresa por email, nombre parcial o teléfono cuando exista ambigüedad.
6. Si un Customer contiene facturas de más de un CIF/NIF, el mapping global queda bloqueado hasta resolver el histórico.

### Facturas Stripe

`stripe_invoice_company_attributions` representa la propiedad legal de una factura Stripe concreta.

Reglas:

1. La factura es un objeto histórico inmutable; EXPERT no modifica el objeto Stripe.
2. El CIF/NIF guardado en la propia factura es evidencia primaria de atribución.
3. Si la factura no contiene CIF/NIF, sólo puede atribuirse mediante revisión manual con motivo documentado.
4. Una factura sólo puede tener una atribución activa por tenant.
5. Una corrección revoca la atribución anterior; no elimina el histórico.
6. `service_role` no dispone de permiso `DELETE` sobre esta tabla.
7. Una atribución explícita prevalece sobre cualquier mapping de Customer.
8. Si una atribución explícita apunta a otra empresa del tenant, Client 360 no puede recuperar esa factura mediante fallback.

Orden de decisión en Client 360:

1. atribución explícita de factura;
2. CIF/NIF de la factura coincidente con la empresa;
3. mapping de Customer sólo cuando la factura no contiene identidad fiscal.

### Suscripciones

`subscriptions.company_id` es la atribución empresarial definitiva de la suscripción.

`subscriptions.client_id` identifica al usuario gestor cuando exista, pero una suscripción no debe quedar conceptualmente vinculada sólo a la persona.

Compartir email nunca justifica atribuir una suscripción a otra empresa.

## Fases de implementación

### Fase A — modelo y lectura segura

Estado: **completada**.

- `company_stripe_customers` como relación canónica de Customer operativo.
- RLS habilitado y acceso backend/service role.
- Client 360 lee todos los Customers mapeados a cada empresa.
- `companies.stripe_customer_id` sólo como fallback legacy.
- Suscripciones consultadas por `client_id` y empresas gestionadas, con deduplicación.
- Sin reescritura de históricos.

### Fase B — herramienta de reconciliación Admin

Estado: **completada en código**.

Client 360 permite inspeccionar un Customer exacto, crear/seleccionar empresa, asociar Customer y suscripción a `company_id`, enlazar mediante `profile_companies`, mostrar evidencia antes de confirmar y bloquear Customers con histórico fiscal mixto.

No se permite autoasignación por email.

### Fase B2 — atribución histórica de facturas

Estado: **completada en código y esquema**.

- `stripe_invoice_company_attributions` conserva la atribución por factura.
- Admin puede inspeccionar una factura exacta y atribuirla con evidencia fiscal.
- Se exige motivo cuando no existe CIF/NIF.
- Las correcciones revocan, no borran.
- Client 360 prioriza la atribución de factura sobre el Customer.
- Las lecturas fallan cerrado cuando no puede resolverse la capa de identidad.
- No existe backfill automático.

### Fase C — reconciliación operativa del caso pendiente

Estado: **pendiente de identidad inequívoca del usuario gestor**.

Preflight actual:

- no existe todavía una `company` canónica suficientemente verificada para cada entidad del caso operativo;
- no existe `profile`/`auth.user` inequívoco derivado de la evidencia de facturación;
- las empresas legacy con `tenant_id = NULL` no se corrigen automáticamente;
- existe al menos un Customer con histórico homogéneo y otro con histórico fiscal mixto; el segundo permanece bloqueado para mapping global.

Cuando el usuario gestor esté identificado:

1. crear/verificar las `companies` con tenant explícito;
2. crear las relaciones `profile_companies` para el mismo perfil;
3. mapear únicamente Customers con evidencia inequívoca;
4. reconciliar cada suscripción con la empresa legal correcta;
5. atribuir facturas históricas según la identidad fiscal guardada en cada factura;
6. mantener bloqueado cualquier Customer con histórico mixto hasta resolver factura por factura;
7. verificar Client 360, facturas, pedidos y permisos por entidad;
8. no fusionar Stripe Customers ni reescribir facturas históricas.

### Fase D — automatización futura

Para nuevas altas y compras:

- el checkout debe resolver siempre `company_id` o crear una entidad explícita;
- Stripe metadata puede incluir identificadores internos no sensibles cuando proceda;
- webhooks deben persistir `company_id` en orders/subscriptions y actualizar `company_stripe_customers` cuando la evidencia sea inequívoca;
- una segunda suscripción del mismo usuario para otra empresa debe crear una relación empresarial separada;
- la reconciliación automática sólo procede con una clave interna inequívoca; en los demás casos se exige revisión manual.

## Reglas de documentación pública

- No publicar nombres reales de clientes vinculados a casos operativos internos.
- No publicar CIF/NIF, emails de facturación ni teléfonos.
- No publicar IDs reales de Stripe (`cus_...`, `sub_...`, `in_...`, `pi_...`, `cs_...`).
- No publicar IDs de Holded, referencias bancarias ni documentos de clientes.
- En issues, PRs, tests y docs usar alias, fixtures sintéticos o identificadores claramente ficticios.
- La evidencia sensible debe permanecer en Stripe, Supabase, Holded u otros conectores autorizados, no en Git.

## Criterios de aceptación

- Un usuario puede gestionar varias entidades sin duplicar su cuenta personal.
- Cada suscripción aparece bajo la entidad legal correcta.
- Las facturas históricas se muestran bajo la empresa que figura legalmente en cada factura, incluso cuando Stripe reutilizó un Customer.
- Una entidad no hereda históricos de otra por compartir Customer o email.
- Client 360 admite varios Stripe Customers por empresa.
- Ningún histórico financiero se fusiona, elimina o reasigna por heurística de email.
- Toda corrección productiva queda basada en evidencia, confirmación explícita y trazabilidad.
