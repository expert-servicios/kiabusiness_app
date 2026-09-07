# Plan de identidad multi-entidad y reconciliación Stripe

Fecha: 2026-09-07

## Decisión de negocio confirmada

Un mismo usuario de EXPERT puede gestionar varias entidades fiscales o mercantiles. La identidad de acceso y la identidad de facturación no son la misma cosa.

Caso de referencia confirmado:

- el mismo usuario gestiona **ALVILS ESP, S.L.U.** e **Inversiones Paso Seguro**;
- la suscripción Stripe activa `sub_1S0IA7LeYwwgvux4vE1VB7DK` corresponde a **ALVILS ESP, S.L.U.**;
- Stripe Customer `cus_SwAQzEZGfhlP5S` aparece como `ALVILS`, con CIF de factura `B56305501`, y es el Customer de la suscripción activa;
- Stripe Customer `cus_OQkYuIkz8n5FYB` aparece actualmente como `INVERSIONES PASO SEGURO`, pero su histórico fue reutilizado para más de una identidad fiscal;
- ambos Stripe Customers comparten actualmente el mismo email de contacto. Ese email **no debe usarse como clave de identidad ni como criterio de fusión**.

## Hallazgo de preflight: Customer reutilizado entre entidades

El preflight de producción sobre `stripe.invoices` demostró que `cus_OQkYuIkz8n5FYB` contiene facturas emitidas a dos CIF distintos:

- facturas antiguas de **ALVILS ESP, S.L.U.**, CIF `B56305501`;
- facturas posteriores de **Inversiones Paso Seguro**, CIF `B54920509`.

Por tanto, un Stripe Customer no puede considerarse por sí solo una identidad contable histórica. El modelo debe distinguir entre:

1. **relación operativa actual empresa ↔ Stripe Customer**;
2. **propietario legal de cada factura histórica**.

Hasta que el histórico mixto esté resuelto, `cus_OQkYuIkz8n5FYB` no debe mapearse íntegramente a Inversiones Paso Seguro.

## Modelo canónico

### Persona / acceso

`profiles` + `auth.users` representan a la persona que accede al portal.

### Empresas gestionadas

`profile_companies` representa la relación muchos-a-muchos entre una persona y las entidades que puede gestionar.

Una persona puede gestionar:

- una sociedad;
- un autónomo;
- varias sociedades;
- una combinación de autónomo + una o más sociedades.

`profiles.active_company_id` sólo representa el contexto activo en la interfaz. No implica propiedad exclusiva ni atribución de cobros.

### Stripe Customers

`company_stripe_customers` es el mapping explícito entre una `company` y uno o varios Stripe Customer IDs para la relación operativa.

Reglas:

1. Un Stripe Customer sólo puede estar asignado a una empresa dentro del mismo tenant cuando su atribución operativa sea inequívoca.
2. Una empresa puede tener varios Stripe Customers para preservar históricos o migraciones.
3. Puede existir como máximo un mapping primario activo por empresa.
4. El campo legado `companies.stripe_customer_id` se mantiene temporalmente por compatibilidad, pero deja de ser el modelo canónico.
5. No se debe inferir la empresa por email, nombre parcial o teléfono cuando exista ambigüedad.
6. Si un Customer contiene facturas de más de un CIF/NIF, el mapping global queda bloqueado hasta resolver el histórico.

### Facturas Stripe

`stripe_invoice_company_attributions` representa la propiedad legal de una factura Stripe concreta.

Reglas:

1. La factura es un objeto histórico inmutable; EXPERT no modifica el objeto Stripe.
2. El CIF/NIF guardado en la propia factura es evidencia primaria de atribución.
3. Si la factura no contiene CIF/NIF, sólo puede atribuirse mediante revisión manual con motivo documentado.
4. Una factura sólo puede tener una atribución activa por tenant.
5. Una corrección revoca la atribución anterior y crea una nueva; no se elimina la fila histórica.
6. `service_role` no dispone de permiso `DELETE` sobre esta tabla.
7. Una atribución explícita prevalece sobre cualquier mapping de Customer.
8. Si una atribución explícita apunta a otra empresa del tenant, Client 360 no puede recuperar esa factura mediante fallback.

Orden de decisión en Client 360:

1. atribución explícita de factura;
2. CIF/NIF de la factura coincidente con la empresa;
3. mapping de Customer sólo si la factura no contiene identidad fiscal.

### Suscripciones

`subscriptions.company_id` es la atribución empresarial definitiva de la suscripción.

`subscriptions.client_id` identifica al usuario gestor cuando exista, pero una suscripción no debe quedar conceptualmente vinculada sólo a la persona.

Para el caso de referencia:

`sub_1S0IA7LeYwwgvux4vE1VB7DK` → `cus_SwAQzEZGfhlP5S` → **ALVILS ESP, S.L.U.**

No debe atribuirse a Inversiones Paso Seguro por compartir email.

## Fases de implementación

### Fase A — modelo y lectura segura

Estado: **completada**.

- Crear `company_stripe_customers`.
- RLS habilitado; tabla accesible sólo por backend/service role.
- Adaptar Client 360 para leer todos los Stripe Customer IDs mapeados a cada empresa.
- Si todavía no hay mappings explícitos, usar `companies.stripe_customer_id` sólo como fallback de compatibilidad.
- Consultar suscripciones tanto por `client_id` como por las empresas gestionadas y deduplicar por ID.
- No modificar datos históricos.

### Fase B — herramienta de reconciliación Admin

Estado: **implementada y desplegada**.

Client 360 incorpora una herramienta explícita para:

- inspeccionar un Stripe Customer exacto;
- crear o seleccionar empresa;
- asociar Stripe Customer a empresa;
- asociar una suscripción existente a `company_id`;
- enlazar la empresa al perfil mediante `profile_companies`;
- mostrar evidencia Stripe antes de confirmar;
- bloquear Customers con más de un CIF/NIF histórico;
- auditar cada mutación.

No se permite autoasignación por email.

### Fase B2 — atribución histórica de facturas

Estado: **en implementación, PR #139**.

Objetivos:

- crear `stripe_invoice_company_attributions`;
- inspeccionar una factura Stripe exacta `in_...` desde Admin;
- atribuirla a una empresa usando el CIF/NIF de la factura como evidencia;
- exigir motivo cuando no haya CIF/NIF;
- impedir reasignaciones automáticas;
- revocar, no borrar, las atribuciones corregidas;
- hacer que Client 360 priorice la atribución de factura sobre el Customer;
- fallar cerrado si no puede resolverse la capa de identidad;
- no hacer backfill automático.

### Fase C — reconciliación ALVILS / Inversiones

Preflight actual:

- no existe todavía una `company` operativa para ALVILS ni para Inversiones Paso Seguro;
- no existe `profile`/`auth.user` inequívoco para el gestor de ambas entidades;
- las cuatro empresas legacy actualmente existentes tienen `tenant_id = NULL`; no se hará backfill automático como parte de esta reconciliación;
- `cus_SwAQzEZGfhlP5S` tiene histórico fiscal homogéneo de ALVILS (`B56305501`) y es candidato limpio para mapping;
- `cus_OQkYuIkz8n5FYB` tiene histórico mixto ALVILS (`B56305501`) + Inversiones (`B54920509`) y permanece bloqueado para mapping global.

Cuando el usuario gestor esté identificado:

1. crear/verificar `companies` para ALVILS e Inversiones Paso Seguro con tenant explícito;
2. crear dos `profile_companies` para el mismo perfil;
3. mapear `cus_SwAQzEZGfhlP5S` a ALVILS;
4. crear o reconciliar `public.subscriptions` para `sub_1S0IA7LeYwwgvux4vE1VB7DK` con `company_id = ALVILS`;
5. atribuir las facturas históricas de `cus_OQkYuIkz8n5FYB` a ALVILS o Inversiones según el CIF/NIF guardado en cada factura;
6. sólo después de resolver el histórico, decidir si `cus_OQkYuIkz8n5FYB` puede quedar como Customer operativo de Inversiones y bajo qué regla;
7. verificar Client 360, facturas, pedidos y permisos por entidad;
8. no fusionar Stripe Customers ni reescribir facturas históricas.

### Fase D — automatización futura

Para nuevas altas y compras:

- el checkout debe recibir siempre `company_id` o crear una nueva entidad de forma explícita;
- Stripe Checkout/Customer metadata debe incluir identificadores internos no sensibles cuando proceda;
- webhooks deben persistir `company_id` en orders/subscriptions y escribir `company_stripe_customers`, no sólo el campo legado;
- una segunda suscripción del mismo usuario para otra empresa debe crear una relación empresarial separada, no reemplazar la anterior;
- reconciliación automática sólo cuando exista una clave interna inequívoca; en cualquier otro caso, revisión manual.

## Criterios de aceptación

- Un usuario puede ver y cambiar entre ALVILS e Inversiones sin duplicar su cuenta personal.
- La suscripción activa `sub_1S0IA7LeYwwgvux4vE1VB7DK` aparece bajo ALVILS.
- Las facturas históricas se muestran bajo la empresa que figura legalmente en cada factura, incluso si Stripe reutilizó el mismo Customer.
- Inversiones Paso Seguro no hereda las facturas históricas de ALVILS por compartir Customer o email.
- Client 360 puede mostrar varios Stripe Customer IDs por empresa cuando existan.
- Ningún histórico financiero se fusiona, elimina o reasigna por heurística de email.
- Toda corrección productiva queda basada en evidencia, confirmación explícita y trazabilidad.
