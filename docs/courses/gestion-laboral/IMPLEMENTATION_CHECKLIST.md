# Checklist de implementación

## Fase 0 · Validación

- [ ] Confirmar que el Payment Link corresponde al producto de 1.200 €.
- [ ] Confirmar texto de la factura y tratamiento fiscal.
- [ ] Confirmar que `/cita` mantiene reunión gratuita de 15 minutos.
- [ ] Confirmar propietario editorial de `/docs/laboral`.

## Fase 1 · Catálogo y landing

- [ ] Ampliar `AcademyProgram` sin romper el programa actual.
- [ ] Añadir `gestion-laboral-integral`.
- [ ] Crear ruta por slug.
- [ ] Implementar hero, módulos, metodología, precio y FAQ.
- [ ] Añadir CTAs de pago, contacto, reunión y descarga.
- [ ] Añadir metadata y JSON-LD.

## Fase 2 · Leads y conversión

- [ ] Adaptar `AcademyLeadForm` por programa.
- [ ] Añadir campos laborales no sensibles.
- [ ] Validar en servidor.
- [ ] Confirmar emails y persistencia.
- [ ] Instrumentar eventos.

## Fase 3 · Descarga

- [ ] Publicar PDF genérico.
- [ ] Verificar nombre y MIME.
- [ ] Registrar descarga.
- [ ] Excluir documento personalizado de Ilya.

## Fase 4 · Base de conocimientos

- [ ] Implementar loader Markdown.
- [ ] Validar frontmatter con Zod.
- [ ] Crear categoría `/docs/laboral`.
- [ ] Crear artículo por manual.
- [ ] Añadir filtros por fase y herramienta.
- [ ] Añadir estados editoriales.

## Fase 5 · Área privada

- [ ] Definir matrícula/entitlement.
- [ ] Proteger en servidor los manuales `student`.
- [ ] Crear vista de acceso no autorizado.
- [ ] Conectar webhook Stripe antes de automatizar acceso.
- [ ] Añadir auditoría mínima.

## Fase 6 · Calidad y lanzamiento

- [ ] Typecheck.
- [ ] Lint.
- [ ] Tests.
- [ ] Build.
- [ ] QA responsive y accesibilidad.
- [ ] QA del embudo completo.
- [ ] Revisión de privacidad.
- [ ] Sitemap.
- [ ] Changelog.
- [ ] Publicación.

