# Checklist de implementación

## Fase 0 · Validación

- [ ] Confirmar que el Payment Link corresponde al producto de 1.200 €.
- [ ] Confirmar texto de la factura y tratamiento fiscal.
- [ ] Confirmar que `/cita` mantiene reunión gratuita de 15 minutos.
- [ ] Confirmar propietario editorial de `/docs/laboral`.

## Fase 1 · Catálogo y landing

- [x] Ampliar `AcademyProgram` sin romper el programa actual.
- [x] Añadir `gestion-laboral-integral`.
- [x] Crear ruta por slug.
- [x] Implementar hero, módulos, metodología, precio y FAQ.
- [x] Añadir CTAs de pago, contacto, reunión y descarga.
- [ ] Añadir metadata y JSON-LD.

## Fase 2 · Leads y conversión

- [x] Adaptar `AcademyLeadForm` por programa.
- [ ] Añadir campos laborales no sensibles.
- [x] Validar en servidor.
- [x] Confirmar emails y persistencia.
- [ ] Instrumentar eventos.

## Fase 3 · Descarga

- [x] Publicar PDF genérico.
- [x] Verificar nombre y MIME.
- [ ] Registrar descarga.
- [x] Excluir documentos personalizados de clientes.

## Fase 4 · Base de conocimientos

- [x] Implementar loader Markdown.
- [x] Validar frontmatter con Zod.
- [x] Crear categoría `/docs/laboral`.
- [x] Crear artículo por manual.
- [x] Añadir filtros por fase y herramienta.
- [x] Añadir estados editoriales.

## Fase 5 · Área privada

- [x] Definir matrícula/entitlement.
- [x] Proteger en servidor los manuales `student`.
- [x] Crear vista de acceso no autorizado.
- [x] Conectar webhook Stripe antes de automatizar acceso.
- [ ] Añadir auditoría mínima.

## Fase 6 · Calidad y lanzamiento

- [ ] Typecheck.
- [ ] Lint.
- [ ] Tests.
- [ ] Build.
- [ ] QA responsive y accesibilidad.
- [ ] QA del embudo completo.
- [ ] Revisión de privacidad.
- [x] Sitemap.
- [x] Changelog.
- [ ] Publicación.
