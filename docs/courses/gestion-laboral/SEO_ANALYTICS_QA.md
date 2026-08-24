# SEO, analítica y QA

## Metadata

```ts
title: 'Curso de Gestión Laboral con Holded y SILTRA | EXPERT'
description: 'Formación práctica de 20 horas y 5 horas de tutoría para gestionar contratos, nóminas, cotizaciones, SILTRA, finiquitos y cierres laborales.'
canonical: 'https://expertconsulting.es/academy/gestion-laboral-integral'
```

## Datos estructurados

- `Course` para el programa.
- `Offer` con precio `1200`, moneda `EUR` y disponibilidad real.
- `Organization` para EXPERT.
- `BreadcrumbList`.
- `Article` para manuales públicos.

No inventar:

- ratings;
- alumnos;
- homologaciones;
- certificaciones;
- fechas de inicio;
- plazas limitadas.

## Sitemap

Añadir landing, categoría laboral y artículos públicos. No incluir manuales privados ni rutas de éxito del pago.

## Indexación

- Landing: `index, follow`.
- Manual público: `index, follow`.
- Manual privado: `noindex, nofollow` y protección real de acceso.
- Página de éxito: `noindex`.

## Analítica

Instrumentar los eventos definidos en `STRIPE_AND_CONVERSION.md`. Validar que no se envían PII ni valores de formularios.

## QA funcional

- [ ] CTA Stripe exacto.
- [ ] Formulario asociado al slug correcto.
- [ ] Reserva abre Cal.com o `/cita`.
- [ ] PDF se descarga y abre.
- [ ] El PDF no contiene datos personales ni información de clientes.
- [ ] Las rutas `/docs/laboral` cargan.
- [ ] Los manuales privados bloquean acceso anónimo.
- [ ] El sitemap incluye solo rutas públicas.
- [ ] El formulario gestiona éxito, error, recaptcha y honeypot.
- [ ] La compra no depende de parámetros manipulables del cliente.

## QA visual

- [ ] 320 px, 375 px, 768 px, 1024 px y escritorio.
- [ ] Sin texto cortado ni botones desbordados.
- [ ] Contraste AA.
- [ ] Foco visible.
- [ ] No hay saltos bruscos durante carga.
- [ ] El PDF se identifica como descarga.
- [ ] Los precios se leen con claridad.

## QA técnica

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Revisión legal editorial

- [ ] Redacción condicionada de la exención de IVA.
- [ ] Política de privacidad enlazada.
- [ ] Condiciones de contratación accesibles.
- [ ] Alcance y exclusiones claros.
- [ ] No se promete sustitución absoluta del criterio profesional.
