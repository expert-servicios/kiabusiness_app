# Plan — checkout por cantidad + expediente histórico de migración Holded

Fecha: 2026-09-08
Relacionado: #159, #161

## Objetivo

Construir un flujo reutilizable de contratación para presupuestos aceptados con servicios por cantidad y add-ons, y registrar correctamente en Cliente 360 servicios históricos pagados que no entraron originalmente por el checkout actual.

## Caso comercial de aceptación

El flujo debe soportar, como ejemplo sintético:

- `holded-migracion-laboral`: 11 empleados × 50 EUR = 550 EUR de base.
- `holded-modulo-formacion`: 1 sesión de 2 h × 180 EUR = 180 EUR de base.
- Base total esperada: 730 EUR.
- Fiscalidad: determinada por la configuración vigente de Stripe/producto, nunca por datos manipulables del navegador.

## Reconciliación histórica

Existe un caso operativo de una factura histórica de migración Holded ya pagada que debe incorporarse a Cliente 360 únicamente cuando se haya reconciliado de forma inequívoca la identidad del gestor y la entidad jurídica correspondiente.

Reglas:

1. No crear `company`, `profile`, `order` o `case` automáticamente a partir de email o nombre de facturación.
2. No mapear un Stripe Customer completo cuando su histórico pueda abarcar varias identidades fiscales.
3. Usar `stripe_invoice_company_attributions` para atribuir una factura concreta a la entidad legal correcta.
4. Comprobar primero que no exista un `order`/`case` histórico asociado al mismo pago.
5. El expediente histórico puede entrar en `en_revision` mientras queden revisiones finales, y pasar a `finalizado` después.
6. Las referencias reales de cliente, CIF/NIF, emails e IDs Stripe deben permanecer únicamente en sistemas internos autorizados, no en documentación pública.

## Plan de implementación del checkout aceptado

### Fase A — líneas de presupuesto

Modelo persistente de líneas (`quote_items` o equivalente):

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

### Fase C — contratación autenticada

- login obligatorio;
- propietario del presupuesto solamente;
- validar `company_id` y pertenencia;
- mostrar líneas, cantidades, subtotal y condiciones;
- generar Stripe Checkout sólo desde datos persistidos del presupuesto.

### Fase D — Stripe + fulfillment

Tras pago confirmado:

- idempotencia por payment/session;
- crear o actualizar order sin duplicados;
- crear case de servicio con company_id;
- para migración laboral, iniciar checklist seguro de empleados;
- para formación, registrar 2 h pendientes de programación;
- notificar a cliente/Admin;
- reflejar el resultado en Cliente 360.

## Seguridad y despliegue

- Preflight obligatorio antes de cualquier DDL o DML histórico.
- DDL exclusivamente mediante migración Supabase.
- No corregir, fusionar o reasignar históricos financieros automáticamente.
- Si aparece un duplicado potencial Stripe/order/quote, detener y revisar manualmente.
- Después de DDL de seguridad, volver a ejecutar Security Advisor.
- CI, typecheck, lint, tests y previews Vercel antes de merge.

## Estado

La implementación funcional de `quote_items` y fulfillment está desarrollada en #162. Este documento queda sólo como referencia de arquitectura; el caso histórico operativo se sigue en #161 sin identificadores sensibles en Git.
