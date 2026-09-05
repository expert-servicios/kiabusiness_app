# Correo 360 rollout

## Cerrado en esta rama
- migración segura de carpetas y estado de organización;
- RLS para Admin/Owner activos;
- carpetas protegidas Entrantes/Enviados;
- CRUD de carpetas personalizadas;
- API idempotente para mover elementos;
- recuento de Entrantes/Enviados desde fuentes reales;
- panel visual de carpetas en `/admin/correo`;
- pruebas de regresión.

## Pendiente antes de marcar la fase completa
- selector visual “Mover a…” en el hilo seleccionado;
- sincronización uniforme de Gmail OAuth / Gmail SA / Microsoft 365 hacia `email_inbox_cache`;
- abrir correo desde carpeta personalizada y conservar contexto;
- asociar movimiento con cliente/empresa/expediente cuando el contexto exista;
- validar CI + previews antes de merge.
