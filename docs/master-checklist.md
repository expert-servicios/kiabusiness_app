# EXPERT - Checklist maestro

Ultima actualizacion: 2026-05-10

Estados:

- `[x]` Cumple.
- `[~]` Parcial.
- `[ ]` Pendiente.

## 0. Saneamiento tecnico

- [x] Resolver conflictos de merge en archivos criticos.
- [x] Recuperar `package.json` y `package-lock.json`.
- [x] Recuperar `typecheck`.
- [x] Recuperar `build`.
- [x] Inicializar Supabase local con `supabase/config.toml`.
- [x] Validar migraciones localmente con Docker y `supabase db reset --local`.
- [x] Migrar `npm run lint` a ESLint compatible con Next actual.
- [x] Alinear `orders` vs `expert_orders`.
- [x] Alinear `documents` vs `case_documents`.
- [x] Alinear bucket `client-documents` vs `user-files`.
- [x] Eliminar rutas duplicadas `app/(app)` frente a `app/(protected)`.
- [x] Fijar `turbopack.root` para evitar que Next use un lockfile externo.
- [x] Centralizar reCAPTCHA v3 y proteccion anti-spam para formularios publicos.
- [x] Crear `docs/improvement-plan.md` como plan vivo de mejoras priorizadas.
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
- [x] Checklist documental visible para cliente.
- [ ] Entregables descargables finales.
- [~] Facturas integradas con Holded.
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
- [x] Plan de accion Holded documentado en `docs/holded-sync-action-plan.md`.
- [x] Conector Holded incorporado en este proyecto.
- [x] Variables `HOLDED_*`.
- [x] Criterio actualizado: Holded ya sincroniza con Stripe; EXPERT no debe duplicar facturas por defecto.
- [~] Sincronizacion de contactos/clientes.
- [x] Proteger la creacion de facturas desde webhooks Stripe con `HOLDED_CREATE_INVOICES_FROM_STRIPE=false` por defecto.
- [x] Cliente API para Holded CRM: funnels, leads y etapas.
- [x] Cliente API para Holded Projects: proyectos, tareas y resumen.
- [x] Cliente API para documentos Holded: `estimate`, `proform` e `invoice`.
- [~] Mapping EXPERT `quotes`/`saas_leads` -> Holded leads. `saas_leads` ya puede enviarse manualmente al CRM Holded desde admin.
- [ ] Mapping EXPERT `quotes` -> Holded `estimate`/`proform`.
- [ ] Mapping EXPERT `orders`/Stripe payments -> Holded invoices sin duplicados.
- [ ] Mapping EXPERT `cases` -> Holded projects.
- [ ] Mapping checklist/tareas EXPERT -> Holded tasks.
- [~] Dashboard admin de sincronizaciones Holded.
- [x] Endpoints admin para sincronizar lead, proyecto, presupuesto y factura.
- [x] Accion admin para sincronizar presupuesto con Holded.
- [x] Accion admin para sincronizar expediente como proyecto Holded.
- [x] Endpoint admin de estado/configuracion Holded.
- [x] Tarjeta de estado Holded en `/admin/integraciones`.
- [~] Idempotencia robusta con mappings externos: migracion y helper creados; falta aplicar en remoto y usar en todos los flujos.
- [ ] Sincronizacion de vuelta Holded CRM/Projects -> EXPERT.
- [ ] Reintento manual desde admin.
- [ ] Sincronizacion financiera Holded con lectura, presupuestos y facturacion controlada.
- [ ] Configuracion por tenant futura.

## 7. Automatizacion

- [x] Email por eventos principales.
- [x] Formularios publicos con reCAPTCHA server-side antes de crear leads o enviar emails.
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
- [x] Admin con bandeja de accion operativa.
- [x] Admin de usuarios permite limpieza segura de usuarios spam sin actividad operativa.
- [ ] Dashboard cliente responde: que falta, en que estado esta, cual es el siguiente paso.
- [x] Dashboard admin responde: que requiere accion ahora.

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

Ejecutar `docs/improvement-plan.md` como fuente principal del siguiente tramo operativo:

1. Cerrar P0 seguridad: firma WhatsApp, redirect auth, fail-closed de secretos obligatorios.
2. Blindar secretos de `client_integrations` en Supabase.
3. Proteger endpoints publicos con coste o enriquecimiento externo.
4. Hacer webhooks Stripe y sincronizaciones Holded idempotentes y durables.
5. Recuperar `npm run lint` y actualizar dependencias auditadas.
