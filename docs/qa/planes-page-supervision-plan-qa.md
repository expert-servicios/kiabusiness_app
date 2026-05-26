# QA - Pagina /planes con Plan Supervision

Fecha: 2026-05-26

## Casos de validacion

1. `/planes` no muestra "Plan Gratuito" como plan EXPERT.
2. La prueba Holded 14 dias aparece como bloque independiente antes de los planes.
3. Plan Supervision aparece con precio 49 EUR/mes + IVA.
4. Plan Supervision indica que no incluye presentacion de impuestos.
5. Si el usuario quiere impuestos, Kia debe recomendar Plan Avanzado o superior.
6. El checkout de suscripcion mensual bloquea si no hay Holded conectado.
7. Los CTAs principales no dependen de Calendly: usan readiness, portal, Kia, `/cita` o presupuesto.
8. Los planes mensuales usan readiness, no viabilidad.
9. Plan Personalizado se presenta como presupuesto y no tiene checkout directo.
10. Metadata SEO actualizada con "desde 49 EUR/mes".

## Resultado esperado

- Planes visibles: Supervision, Avanzado, Colaborativo y Personalizado.
- Prueba Holded se entiende como software, no como plan EXPERT.
- Pack Starter queda como servicio profesional separado.
- Holded se comunica como obligatorio y no incluido.
- Readiness de `plan-supervision` bloquea cuando falta Holded o API.
- Checkout `/api/subscriptions/checkout` exige perfil, datos fiscales y Holded activo.

## Pruebas automaticas recomendadas

- `npm run typecheck`
- `npx eslint app/(public)/planes/page.tsx components/planes/PlanCtaButton.tsx lib/data/service-readiness-checks.ts lib/services/service-registry.ts app/api/subscriptions/checkout/route.ts`
- `npm run kia:eval`
- `npm run build`

## Validacion ejecutada

- `npm run typecheck` - OK.
- ESLint dirigido sobre planes, readiness, checkout, Kia y emails - OK.
- `npm run kia:eval` - OK, 161 casos pasados.
- `npm run kia:auditor:test` - OK.
- `npm run build` - OK.
- Smoke local `http://localhost:3000/planes` - OK.
- Redirects legacy:
  - `/planes/basico` -> `/planes/avanzado`
  - `/planes/estandar` -> `/planes/colaborativo`
  - `/planes/premium` -> `/planes/presupuesto-personalizado`
