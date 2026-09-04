# EXPERT — Plan de mejoras del Panel Admin

Ultima actualizacion: 2026-09-03

## Objetivo

Convertir el Panel Admin en el centro operativo unico de EXPERT: una ficha por cliente con trazabilidad completa de identidad, entidades fiscales, suscripciones, facturacion, comunicaciones, expedientes, documentos e integraciones.

Este plan complementa `docs/improvement-plan.md` (IMP-001..IMP-024) y continua la numeracion desde IMP-025.

Estados:

- `[ ]` Pendiente
- `[~]` En curso / parcial
- `[x]` Completado y verificado
- `[!]` Bloqueado o requiere decision

Reglas de ejecucion:

- No modificar produccion sin preflight.
- DDL solo mediante migraciones Supabase.
- No borrar, fusionar ni corregir automaticamente historicos financieros.
- Ante posibles duplicados Stripe / Holded / orders, detener y revisar manualmente.
- Cualquier DDL o cambio de seguridad exige Security Advisor posterior.
- Toda accion Admin debe dejar trazabilidad suficiente para auditoria.
- El modelo multi-entidad usa `companies` + `profile_companies` como modelo canonico; una persona puede gestionar varias entidades y cada dato operativo debe poder atribuirse a la entidad correcta cuando aplique.

---

## Estado inicial auditado — 2026-09-03

La ficha Admin de cliente ya dispone de:

- perfil y datos fiscales;
- empresas/entidades asociadas;
- expedientes;
- suscripciones;
- presupuestos;
- pedidos/pagos;
- WhatsApp registrado;
- integraciones Holded;
- mappings y eventos de sincronizacion;
- pestañas Resumen / Timeline / Documentos.

El timeline actual ya combina expedientes, WhatsApp, emails transaccionales, pagos, presupuestos, citas, suscripciones, documentos y pagos manuales.

Gaps detectados:

1. Los emails visibles proceden principalmente de `email_events`: muestran envios del sistema, no toda la conversacion real del buzon.
2. `email_threads` y `email_inbox_cache` existen, pero no forman parte de la ficha 360.
3. Los mensajes internos de expediente (`messages`) no estan integrados en el timeline general.
4. Hay varias fuentes documentales (`documents`, `case_documents`, `files`, `user_files`) y la ficha no ofrece una vista normalizada de todas ellas.
5. La atribucion por `company_id` es parcial; depende del PR de multi-entidad #51.
6. Suscripciones y portal Stripe historicamente se resolvian por perfil, no por entidad.
7. No existe todavia una bandeja operacional unica de incidencias: checkouts abandonados, syncs fallidos, documentos pendientes, vencimientos y errores de facturacion.

---

## IMP-025 — Ficha Cliente 360º

**Prioridad:** P0 producto / P1 operacion  
**Estado:** `[~]`

### Alcance

Una ficha de cliente debe permitir responder sin salir de ella:

- quien es el cliente;
- que entidades gestiona;
- que plan tiene cada entidad;
- que se le ha enviado y que ha respondido;
- que documentos existen y a que expediente/entidad pertenecen;
- que pagos/facturas/presupuestos existen;
- que queda pendiente;
- que errores de integracion existen.

### Subtareas

- [x] Resumen de perfil, entidades, expedientes, subs, quotes, orders e integraciones ya disponible.
- [x] Timeline unificado base ya disponible.
- [~] Incorporar email real (`email_threads` / `email_inbox_cache`) al historial.
- [~] Incorporar mensajes internos de expediente (`messages`).
- [ ] Mostrar contenido completo de emails transaccionales conservados en `email_events.html`.
- [ ] Vista de comunicaciones dedicada, ordenada cronologicamente.
- [ ] Etiquetar eventos por entidad cuando exista `company_id`.
- [ ] Filtro por entidad / expediente / canal.
- [ ] Acciones rapidas: responder email, WhatsApp, abrir expediente, reenviar invitacion, subir documento.

### Criterio de aceptacion

Desde `/admin/clientes/[id]`, un admin puede reconstruir toda la historia operativa del cliente sin consultar manualmente Stripe, Holded, Gmail o tablas de Supabase para las fuentes ya sincronizadas.

---

## IMP-026 — Admin multi-entidad

**Prioridad:** P0  
**Estado:** `[~]` — depende de PR #51

### Alcance

Una cuenta personal puede administrar N entidades fiscales. Ejemplo:

- Josep Sanchez
  - SIGMAKNOT S.L.
  - Josep Sanchez — Empresario individual

Cada entidad puede tener de forma independiente:

- datos fiscales;
- Holded;
- Stripe Customer;
- suscripcion;
- pedidos/facturas;
- expedientes;
- documentos;
- comunicaciones vinculadas cuando sea posible.

### Subtareas

- [~] `companies` + `profile_companies` como modelo canonico.
- [~] `profiles.active_company_id` corregido hacia `companies`.
- [~] checkout y suscripciones por entidad.
- [~] portal Stripe por entidad.
- [ ] UI Admin para crear/seleccionar Sociedad vs Autonomo.
- [ ] Ficha 360 con selector y filtro de entidad.
- [ ] Mostrar estado operativo por entidad: plan, Holded, Stripe, expedientes, pendientes.

### Criterio de aceptacion

Un mismo usuario puede tener dos entidades con dos suscripciones y operarlas sin mezclar facturacion, documentos o expedientes.

---

## IMP-027 — Centro de comunicaciones

**Prioridad:** P1  
**Estado:** `[~]`

### Fuentes

- `email_events`: emails enviados por EXPERT, incluido HTML cuando esta disponible.
- `email_threads`: hilos vinculados a expediente/cliente.
- `email_inbox_cache`: mensajes sincronizados del buzon.
- Gmail/Outlook conectados mediante sincronizacion existente.
- `whatsapp_conversations`.
- `messages`: conversacion interna de expedientes.

### Mejoras

- [~] timeline incorpora todas las fuentes disponibles localmente.
- [ ] pestaña Comunicaciones.
- [ ] visualizacion del cuerpo completo de email enviado.
- [ ] indicador entrante / saliente.
- [ ] adjuntos y enlaces a documentos.
- [ ] vinculacion manual de hilo a cliente/expediente cuando no se resuelva automaticamente.
- [ ] redactar respuesta desde Admin reutilizando proveedor conectado.
- [ ] busqueda por asunto, fecha, canal y entidad.

### Seguridad

No persistir credenciales ni tokens en UI. Los cuerpos/adjuntos se muestran solo a roles autorizados y las URLs de Storage deben ser firmadas y temporales.

---

## IMP-028 — Documentacion 360º

**Prioridad:** P1  
**Estado:** `[~]`

### Fuentes detectadas

- `documents`
- `case_documents`
- `files`
- `user_files`
- documentos procedentes de Google Drive cuando exista mapping autorizado
- adjuntos de correo que se materialicen/documenten

### Mejoras

- [ ] inventario normalizado sin borrar fuentes legacy.
- [ ] agrupacion por entidad y expediente.
- [ ] diferenciar recibido del cliente / generado por EXPERT / entregable final.
- [ ] URLs temporales firmadas.
- [ ] deteccion visual de duplicados sin eliminacion automatica.
- [ ] busqueda por nombre, tipo, expediente, entidad y fecha.
- [ ] indicador de checklist documental pendiente/completo.

---

## IMP-029 — Facturacion y suscripciones operativas

**Prioridad:** P0/P1  
**Estado:** `[~]` — parte en PR #50 y #51

### Mejoras

- [x] importacion historica Stripe segura preparada en Admin.
- [~] checkout de suscripcion persistido antes del pago.
- [ ] estados `open / completed / expired` consistentes.
- [ ] deteccion de checkout abandonado.
- [ ] reenvio de enlace desde la misma ficha sin perder trazabilidad.
- [ ] facturas Stripe visibles por cliente y entidad.
- [ ] conciliacion visual Stripe ↔ order ↔ Holded invoice.
- [ ] bloquear acciones automaticas ante duplicados o inconsistencias.

---

## IMP-030 — Bandeja operativa Admin

**Prioridad:** P1  
**Estado:** `[ ]`

Un dashboard de trabajo, no solo estadisticas.

### Colas propuestas

- checkouts abiertos/abandonados;
- suscripciones past_due/unpaid;
- documentos pendientes;
- expedientes vencidos o sin siguiente accion;
- Holded sync failed;
- Stripe/Holded mapping inconsistente;
- emails entrantes sin responder;
- citas pendientes;
- perfiles incompletos;
- clientes sin entidad activa cuando deberian tenerla.

### Criterio de aceptacion

Cada elemento de la bandeja abre directamente la ficha o expediente donde puede resolverse.

---

## IMP-031 — Calidad de datos y protecciones

**Prioridad:** P0 transversal  
**Estado:** `[~]`

- [x] no autocorregir historicos financieros.
- [x] bloqueo de importacion Stripe ante conflictos de vinculacion.
- [~] validacion de pertenencia de `active_company_id`.
- [ ] alertas por NIF/CIF duplicado entre entidades vinculadas.
- [ ] alertas por Stripe Customer compartido accidentalmente.
- [ ] alertas por subscription/order sin entidad en flujos nuevos.
- [ ] auditoria de escrituras Admin sensibles.

---

## IMP-032 — Busqueda global Admin

**Prioridad:** P2  
**Estado:** `[ ]`

Busqueda unica por:

- nombre;
- email;
- telefono;
- NIF/CIF;
- razon social;
- Stripe customer/subscription/payment;
- Holded contact/invoice;
- expediente;
- numero de factura/presupuesto.

Resultado agrupado por cliente y entidad con acceso directo.

---

## IMP-033 — Experiencia Admin y productividad

**Prioridad:** P2  
**Estado:** `[ ]`

- acciones rapidas contextuales;
- menos pantallas duplicadas;
- estados y badges consistentes;
- filtros persistentes;
- exportacion PDF de ficha cliente;
- enlaces profundos a Stripe/Holded/Drive sin exponer secretos;
- responsive util en movil/tablet;
- historial de acciones de staff.

---

## Orden de ejecucion recomendado

### Fase A — Cliente 360 y multi-entidad

1. IMP-025 Ficha 360
2. IMP-026 Multi-entidad
3. IMP-027 Comunicaciones
4. IMP-028 Documentos

### Fase B — Cobro y control operativo

5. IMP-029 Facturacion/suscripciones
6. IMP-030 Bandeja operativa
7. IMP-031 Calidad de datos

### Fase C — Productividad

8. IMP-032 Busqueda global
9. IMP-033 UX Admin

---

## Verificacion obligatoria antes de cerrar cada IMP

- TypeScript.
- ESLint.
- Vitest/regresion afectada.
- Build/preview Vercel.
- Preflight Supabase si toca datos/esquema.
- Security Advisor si hay DDL o seguridad.
- Comprobacion manual de un caso multi-entidad equivalente a Josep: una cuenta, sociedad + autonomo, dos suscripciones, comunicaciones y documentos separados.
