# EXPERT - Checklist maestro

Ultima actualizacion: 2026-05-07

Estados:

- `[x]` Cumple.
- `[~]` Parcial.
- `[ ]` Pendiente.

## 0. Saneamiento tecnico

- [x] Resolver conflictos de merge en archivos criticos.
- [x] Recuperar `package.json` y `package-lock.json`.
- [x] Recuperar `typecheck`.
- [x] Recuperar `build`.
- [x] Migrar `npm run lint` a ESLint compatible con Next actual.
- [x] Alinear `orders` vs `expert_orders`.
- [x] Alinear `documents` vs `case_documents`.
- [x] Alinear bucket `client-documents` vs `user-files`.
- [x] Eliminar rutas duplicadas `app/(app)` frente a `app/(protected)`.
- [x] Fijar `turbopack.root` para evitar que Next use un lockfile externo.
- [~] Limpiar documentacion principal. `roadmap`, `checklist` y `architecture` quedan normalizados; README puede revisarse despues.

## 1. Vision EXPERT

- [x] EXPERT se entiende como asesoria digital propia en fase actual.
- [x] EXPERT queda documentada como futura plataforma SaaS vertical.
- [x] La documentacion distingue fase actual y fase SaaS futura.
- [ ] Cada decision nueva se etiqueta con fase y categoria de producto.

## 2. Principio estrategico

- [x] Construir primero para la operativa propia de Ksenia.
- [~] Evitar hardcodear decisiones que bloqueen SaaS futuro.
- [ ] Crear capa de configuracion por tenant.
- [ ] Hacer configurables servicios, estados, plantillas, branding e integraciones.

## 3. Producto actual: asesoria digital EXPERT

- [x] Web publica de servicios, planes, Holded, blog y contacto.
- [x] Auth con Google y magic link.
- [~] Presupuestos, pagos y suscripciones.
- [~] Portal cliente con expedientes y documentos.
- [~] Comunicaciones automaticas por email.
- [ ] Checklist documental visible para cliente.
- [ ] Entregables descargables finales.
- [ ] Facturas integradas con Holded.
- [ ] Resenas por servicio.

## 4. Producto futuro: SaaS para asesorias

- [x] Ruta `/para-asesorias`.
- [x] Captacion B2B discreta.
- [x] Lead form B2B completo.
- [ ] Tenants.
- [ ] Branding, servicios, plantillas, estados e integraciones por tenant.
- [ ] Camino para pilotos externos.

## 5. Arquitectura multi-tenant futura

- [ ] `tenants`.
- [ ] `tenant_settings`.
- [ ] `tenant_branding`.
- [ ] `tenant_integrations`.
- [ ] `tenant_email_templates`.
- [ ] `tenant_whatsapp_templates`.
- [ ] `tenant_automation_rules`.
- [ ] `tenant_roles`.
- [~] `companies` existe, pero representa empresas/clientes, no tenants.
- [ ] Entidades criticas con `tenant_id` o estrategia de migracion clara.

## 6. Holded

- [x] Holded identificado como integracion estrategica.
- [ ] Conector Holded incorporado en este proyecto.
- [ ] Variables `HOLDED_*`.
- [ ] Sincronizacion de contactos/clientes.
- [ ] Creacion de facturas desde pagos Stripe.
- [ ] Mapping Stripe `orders` -> Holded invoice.
- [ ] Configuracion por tenant futura.

## 7. Automatizacion

- [x] Email por eventos principales.
- [x] Creacion de expediente tras pago alineada con tabla `orders`.
- [~] Solicitud de resena al finalizar expediente.
- [ ] Checklist documental automatico.
- [ ] Emails por cambio de estado.
- [ ] Recordatorios de documentacion pendiente.
- [ ] Seguimiento de presupuestos abiertos.
- [ ] Alertas de pago fallido visibles para admin.
- [ ] Resumen diario admin.
- [ ] Clasificacion de leads con IA conectada al flujo real.

## 8. WhatsApp Business

- [~] Campos de WhatsApp y consentimiento.
- [~] Webhook base.
- [ ] Parser real de webhook Meta.
- [ ] Envio real de plantillas.
- [ ] Enlaces al panel seguro.
- [ ] Regla aplicada: WhatsApp lleva al panel, no lo sustituye.

## 9. IA y agentes

- [~] `ai_logs` y base de funciones.
- [ ] Clasificacion de salidas: automatica permitida, borrador, requiere humano.
- [ ] UI de revision/aprobacion.
- [ ] Agente de leads.
- [ ] Agente documental.
- [ ] Agente de expediente.
- [ ] Agente operativo diario.
- [ ] Bloqueo de asesoramiento final automatico sin revision humana.

## 10. Web publica y menu

- [~] Menu publico enfocado en cliente final.
- [ ] Header final: Servicios, Planes, Formacion, Recursos, Contacto, Acceso cliente.
- [x] `/para-asesorias` enlazada solo desde footer y bloque secundario de Home.
- [ ] Paginas de categoria y servicio estandarizadas.

## 11. Experiencia operativa

- [~] Web publica premium y clara.
- [~] Panel cliente con expedientes, pero falta orientar por proxima accion.
- [~] Admin con KPIs, pero falta bandeja de accion operativa.
- [ ] Dashboard cliente responde: que falta, en que estado esta, cual es el siguiente paso.
- [ ] Dashboard admin responde: que requiere accion ahora.

## 12. Regla de producto

Toda funcionalidad nueva debe clasificarse como una o varias de estas categorias:

- [ ] Captacion.
- [ ] Conversion.
- [ ] Operacion.
- [ ] Comunicacion.
- [ ] Automatizacion.
- [ ] Retencion.
- [ ] Escalabilidad SaaS.

## Siguiente bloque recomendado

Ejecutar Fase 1 y Fase 2:

1. Consolidar header/footer con el menu publico recomendado.
2. Estandarizar paginas de categoria y servicio.
3. Mejorar portal cliente alrededor de proxima accion.
4. Incorporar el conector Holded existente.
