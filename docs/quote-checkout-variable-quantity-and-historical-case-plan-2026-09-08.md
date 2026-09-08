# Plan — checkout por cantidad + expediente histórico de migración Holded

Fecha: 2026-09-08
Relacionado: #159

## Objetivo

Construir un flujo reutilizable de contratación para presupuestos aceptados con servicios por cantidad y add-ons, y registrar correctamente en Cliente 360 servicios históricos pagados que no entraron originalmente por el checkout actual.

## Caso comercial inmediato

La siguiente contratación debe poder gestionarse desde EXPERT sin exponer ni confiar en cantidades enviadas por URL:

- `holded-migracion-laboral`: 11 empleados x 50 EUR = 550 EUR de base.
- `holded-modulo-formacion`: 1 sesión de 2 h x 180 EUR = 180 EUR de base.
- Base total esperada: 730 EUR.
- Fiscalidad: determinada por la configuración vigente de Stripe / producto, no por datos manipulables del navegador.

## Hallazgo histórico verificado en Stripe

Existe una factura live ya pagada por `Migración completa a Holded (sin inventario)`:

- Stripe invoice: `in_1Tdp3CLeYwwgvux4jhkIeIJp`
- Número de factura: `EXP-0053`
- Stripe Customer: `cus_OQkYuIkz8n5FYB`
- Entidad fiscal de la factura: INVERSIONES PASO SEGURO
- CIF: B54920509
- Base: 899,00 EUR
- IVA: 188,79 EUR
- Total: 1.087,79 EUR
- Estado: paid

La migración asociada está operativamente finalizada salvo revisiones finales y la futura propuesta de plan de suscripción 2027.

## Preflight de producción realizado

Antes de crear ningún registro histórico se comprobó en Supabase producción:

1. No existe actualmente una fila `companies` identificable por CIF B54920509 / nombre INVERSIONES PASO SEGURO.
2. No existe un usuario/perfil con el email de facturación observado en Stripe.
3. No existe `company_stripe_customers` para `cus_OQkYuIkz8n5FYB`.
4. No existe atribución explícita de `in_1Tdp3CLeYwwgvux4jhkIeIJp` en `stripe_invoice_company_attributions`.

Por tanto, **no se crea todavía el expediente histórico**: `cases.client_id` requiere un cliente real y la plataforma no debe inventar ni inferir la identidad del gestor de la empresa a partir del email compartido de Stripe.

## Regla de reconciliación histórica

El expediente solo se podrá incorporar cuando exista una relación explícita y validada:

`auth.user/profile -> profile_companies -> companies(B54920509) -> Stripe invoice attribution`

No usar email como clave de identidad.
No reasignar el Stripe Customer completo si su histórico contiene más de una entidad fiscal.
La factura concreta sí puede atribuirse explícitamente a la entidad correcta mediante el flujo de atribución de facturas ya existente.

## Expediente histórico a crear después de reconciliar identidad

Una vez la empresa y su gestor estén vinculados de forma segura:

- category: `holded`
- service: `Migración completa a Holded (sin inventario)`
- company_id: entidad B54920509
- client_id: perfil gestor validado
- state: `en_revision` mientras falten las revisiones finales
- al terminar las revisiones: `finalizado`
- metadata / nota operativa si el modelo disponible lo permite:
  - source: `historical_stripe_reconciliation`
  - stripe_invoice_id: `in_1Tdp3CLeYwwgvux4jhkIeIJp`
  - stripe_customer_id: `cus_OQkYuIkz8n5FYB`
  - paid_amount_eur: 1087.79
  - migration_scope: `holded-migracion-sin-inventario`
  - next_step: `revision_final_y_propuesta_suscripcion_2027`

No crear un segundo `order` si ya existe uno asociado al mismo pago. Antes del alta, buscar por `stripe_payment_id`, invoice metadata y cualquier registro importado desde Stripe.

## Plan de implementación del checkout aceptado

### Fase A — líneas de presupuesto

Crear un modelo persistente de líneas (`quote_items` o equivalente):

- quote_id
- service_slug
- stripe_price_id
- description
- quantity
- unit_amount_eur
- tax_behavior
- sort_order

Reglas de negocio en servidor:

- `holded-migracion-laboral`: cantidad entera, mínimo 5.
- `holded-modulo-formacion`: cantidad 1 para la oferta estándar de 2 h.
- El navegador nunca decide importe ni cantidad final.

### Fase B — Admin

Desde Cliente 360 / Presupuestos:

- seleccionar cliente y entidad;
- añadir servicios desde catálogo;
- introducir cantidad cuando el servicio lo permita;
- ver base total antes de enviar;
- crear y enviar enlace EXPERT.

### Fase C — página de contratación

Ruta prevista: `/contratar/presupuesto/[id]`

- login obligatorio;
- propietario del presupuesto solamente;
- validar `company_id` y pertenencia;
- mostrar líneas, cantidades, subtotal y condiciones;
- generar Stripe Checkout solo desde datos persistidos del presupuesto.

### Fase D — Stripe + fulfillment

Tras pago confirmado:

- idempotencia por payment/session;
- crear o actualizar order sin duplicados;
- crear case de servicio con company_id;
- para migración laboral, iniciar checklist seguro de empleados;
- para formación, registrar 2 h pendientes de programación;
- notificar al cliente y Admin;
- reflejar todo en Cliente 360.

## Seguridad y despliegue

- Preflight obligatorio antes de cualquier DDL o DML histórico.
- DDL exclusivamente mediante migración Supabase.
- No corregir, fusionar o reasignar históricos financieros automáticamente.
- Si aparece un duplicado potencial Stripe/order/quote, detener y revisar manualmente.
- Después de DDL de seguridad, volver a ejecutar Security Advisor.
- CI, typecheck, lint, tests y previews Vercel antes de merge.

## Siguiente paso

1. Reconciliar de forma explícita la identidad de INVERSIONES PASO SEGURO con su perfil gestor en la plataforma.
2. Atribuir la factura EXP-0053 a esa company exacta.
3. Comprobar que no existe order/case histórico duplicado.
4. Crear el expediente histórico de migración en estado `en_revision`.
5. Implementar el modelo de `quote_items` y el checkout por líneas del issue #159.
