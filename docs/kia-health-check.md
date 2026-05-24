# Kia Health Check

Ultima revision: 2026-05-24

## Que mide

Kia Health mide tres capas:

- salud tecnica: Supabase, providers IA, WABA, Stripe, flags y decision logs.
- salud de comportamiento: intent, nextAction, idioma, seguridad, reglas y resumen auditable.
- salud operativa: anomalies abiertas, latencia, coste estimado y fallos recientes.
- calidad conversacional: posible bucle repetitivo, respuesta demasiado parecida al historial y exceso de `needs_review`.

## Donde esta

- Panel: `/admin/kia-health`
- API resumen: `GET /api/admin/kia/health`
- Ejecutar manual: `POST /api/admin/kia/health/run`
- Cron: `GET /api/cron/kia-health` con `Authorization: Bearer CRON_SECRET`

## Semaforo

- Verde: sin fallos ni anomalies criticas.
- Amarillo: warnings, latencia alta, provider status degradado o checks no criticos fallando.
- Rojo: fallo critico, riesgo API key, checkout inseguro, impuestos presentados por IA, flujo Holded/Planes mal dirigido o provider sin fallback.

`repeated_answer_loop` empieza como anomalia media salvo que se combine con otra regla critica. Sirve para detectar cuando Kia vuelve a repetir frases o CTAs aunque el sistema siga respondiendo con HTTP 200.

## Produccion Friend-Test

Antes de probar con usuarios amigos:

1. Aplicar migraciones `kia_decision_logs` y `kia_health_check`.
2. Activar `KIA_HEALTH_ENABLED=true`.
3. Activar `KIA_HEALTH_CANARY_ENABLED=true`.
4. Mantener `KIA_AI_TOOLS_ENABLED=false`.
5. Ejecutar un canary manual desde `/admin/kia-health`.

Si hay rojo, apagar solo el canal afectado:

```env
KIA_STRUCTURED_AI_WABA_ENABLED=false
```
