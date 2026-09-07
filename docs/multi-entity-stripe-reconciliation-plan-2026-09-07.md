# Plan de identidad multi-entidad y reconciliación Stripe

Fecha: 2026-09-07

## Decisión de negocio confirmada

Un mismo usuario de EXPERT puede gestionar varias entidades fiscales o mercantiles. La identidad de acceso y la identidad de facturación no son la misma cosa.

Caso de referencia confirmado:

- el mismo usuario gestiona **ALVILS ESP, S.L.U.** e **Inversiones Paso Seguro**;
- la suscripción Stripe activa `sub_1S0IA7LeYwwgvux4vE1VB7DK` corresponde a **ALVILS ESP, S.L.U.**;
- Stripe customer `cus_SwAQzEZGfhlP5S` aparece como `ALVILS`, con CIF de factura `B56305501`, y es el customer de la suscripción activa;
- Stripe customer `cus_OQkYuIkz8n5FYB` aparece como `INVERSIONES PASO SEGURO` y no tiene suscripción activa confirmada;
- ambos Stripe Customers comparten actualmente el mismo email de contacto. Ese email **no debe usarse como clave de identidad ni como criterio de fusión**.

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

Se introduce `company_stripe_customers` como mapping explícito entre una `company` y uno o varios Stripe Customer IDs.

Reglas:

1. Un Stripe Customer sólo puede estar asignado a una empresa dentro del mismo tenant.
2. Una empresa puede tener varios Stripe Customers para preservar históricos o migraciones.
3. Puede existir como máximo un mapping primario activo por empresa.
4. El campo legado `companies.stripe_customer_id` se mantiene temporalmente por compatibilidad, pero deja de ser el modelo canónico.
5. No se debe inferir la empresa por email, nombre parcial o teléfono cuando exista ambigüedad.

### Suscripciones

`subscriptions.company_id` es la atribución empresarial definitiva de la suscripción.

`subscriptions.client_id` identifica al usuario gestor cuando exista, pero una suscripción no debe quedar conceptualmente vinculada sólo a la persona.

Para el caso de referencia:

`sub_1S0IA7LeYwwgvux4vE1VB7DK` → `cus_SwAQzEZGfhlP5S` → **ALVILS ESP, S.L.U.**

No debe atribuirse a Inversiones Paso Seguro por compartir email.

## Fases de implementación

### Fase A — modelo y lectura segura

- Crear `company_stripe_customers`.
- RLS habilitado; tabla accesible sólo por backend/service role.
- Adaptar Client 360 para leer todos los Stripe Customer IDs mapeados a cada empresa.
- Si todavía no hay mappings explícitos, usar `companies.stripe_customer_id` sólo como fallback de compatibilidad.
- Consultar suscripciones tanto por `client_id` como por las empresas gestionadas y deduplicar por ID.
- No modificar datos históricos.

### Fase B — herramienta de reconciliación Admin

Crear una acción explícita de Admin para:

- crear o seleccionar empresa;
- asociar Stripe Customer a empresa;
- marcar mapping primario/histórico;
- asociar suscripción existente a `company_id`;
- enlazar la empresa al perfil mediante `profile_companies`;
- mostrar evidencia Stripe antes de confirmar.

No se permitirá autoasignación por email cuando existan dos o más candidatos.

### Fase C — reconciliación ALVILS / Inversiones

Preflight actual:

- no existe todavía una `company` operativa para ALVILS ni para Inversiones Paso Seguro;
- no existe `profile`/`auth.user` con el email compartido de Stripe;
- por tanto, no se crearán registros productivos hasta identificar de forma inequívoca el usuario gestor que debe recibir ambas memberships.

Cuando el usuario esté identificado:

1. crear/verificar `companies` para ALVILS e Inversiones Paso Seguro;
2. crear dos `profile_companies` para el mismo perfil;
3. mapear `cus_SwAQzEZGfhlP5S` a ALVILS;
4. mapear `cus_OQkYuIkz8n5FYB` a Inversiones Paso Seguro;
5. crear o reconciliar `public.subscriptions` para `sub_1S0IA7LeYwwgvux4vE1VB7DK` con `company_id = ALVILS`;
6. verificar Client 360, facturas, pedidos y permisos por entidad;
7. no fusionar Stripe Customers ni reescribir facturas históricas.

### Fase D — automatización futura

Para nuevas altas y compras:

- el checkout debe recibir siempre `company_id` o crear una nueva entidad de forma explícita;
- Stripe Checkout/Customer metadata debe incluir identificadores internos no sensibles cuando proceda;
- webhooks deben persistir `company_id` en orders/subscriptions;
- una segunda suscripción del mismo usuario para otra empresa debe crear una relación empresarial separada, no reemplazar la anterior;
- reconciliación automática sólo cuando exista una clave interna inequívoca; en cualquier otro caso, revisión manual.

## Criterios de aceptación

- Un usuario puede ver y cambiar entre ALVILS e Inversiones sin duplicar su cuenta personal.
- Las facturas y suscripciones de ALVILS aparecen bajo ALVILS aunque el email coincida con otra empresa.
- Inversiones Paso Seguro conserva su Stripe Customer y su historial independiente.
- Client 360 puede mostrar varios Stripe Customer IDs por empresa cuando existan.
- Ningún histórico financiero se fusiona, elimina o reasigna por heurística de email.
- Toda corrección productiva queda basada en evidencia y confirmación explícita.
