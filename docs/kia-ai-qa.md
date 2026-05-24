# Kia AI QA

Ultima revision: 2026-05-23

## Casos manuales minimos

1. Lead nuevo pide precio: Kia identifica lead y ofrece servicio, viabilidad, readiness o llamada.
2. Cliente con expediente pregunta estado: Kia usa flujo cliente, no lead.
3. Usuario intenta contratar plan mensual sin Holded: Kia exige readiness y conexion Holded.
4. Usuario pide pasar API key por WhatsApp: Kia no la pide y manda enlace al panel seguro.
5. Servicio fiscal con viabilidad: Kia usa viabilidad, no readiness.
6. Servicio Holded: Kia usa readiness, no viabilidad.
7. Duda compleja: Kia ofrece llamada 15 minutos, no `needs_review`.
8. IA no sabe responder: `needs_review` permitido.
9. Documento recibido: Kia clasifica, guarda confianza y sugiere expediente/checklist.
10. Dashboard Estado de empresa: Kia avisa que es resumen estimado pendiente de revision profesional.
11. Admin responde mensaje seleccionado: Kia responde a ese mensaje, no a todo el hilo.
12. Salida JSON invalida: repair retry; si falla, fallback seguro.

## Criterio de salida

No activar WABA publico hasta que admin compose genere logs utiles y todos los casos anteriores pasen sin pedir datos sensibles ni saltarse gates de checkout/readiness.

## Friend-Test En Produccion

Como EXPERT/Kia aun no estan abiertos al publico, se permite probar en produccion con usuarios amigos/testers. Condiciones:

- aplicar antes la migracion `kia_decision_logs`.
- mantener `KIA_AI_TOOLS_ENABLED=false`.
- mantener `KIA_AI_DOCUMENT_CLASSIFICATION_ENABLED=false` hasta revisar subidas reales.
- mantener `KIA_AI_ACCOUNTING_SUMMARY_ENABLED=false` hasta conectar snapshots reales.
- activar `KIA_STRUCTURED_AI_ADMIN_ENABLED=true` y `KIA_STRUCTURED_AI_WABA_ENABLED=true` solo si hay decision logs activos.
- si aparece respuesta vacia, repetitiva, insegura o demasiado libre, apagar `KIA_STRUCTURED_AI_WABA_ENABLED=false` y conservar admin compose.
