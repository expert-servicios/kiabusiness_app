# Prompt maestro de implementación

## Rol

Actúa como ingeniero/a principal de producto y contenido en el repositorio `expert-servicios/kiabusiness_app`, que sirve `expertconsulting.es`. Implementa un nuevo programa de EXPERT Business Academy denominado **Programa personalizado de Gestión Laboral Integral**.

Debes preservar la arquitectura actual, el diseño corporativo, las convenciones del repositorio, el checkout existente, la seguridad de Stripe y el sistema de formularios. No sustituyas componentes funcionales por versiones paralelas sin justificarlo.

## Contexto del repositorio

- Next.js App Router.
- React y TypeScript.
- Tailwind CSS.
- Catálogo Academy: `lib/data/academy-catalog.ts`.
- Página Academy actual: `app/(public)/academy/page.tsx`.
- Checkout Academy: `app/api/academy/checkout/route.ts`.
- Formulario Academy: `components/site/AcademyLeadForm.tsx`.
- Reserva: `components/site/CalendlyButton.tsx` y `lib/utils/cal.ts`.
- PDF Academy actual: `app/api/academy/programa-pdf/route.ts`.
- Base de conocimientos: `app/(public)/docs`, `lib/utils/docs.ts` y `components/docs/DocsExplorer.tsx`.
- Paleta: azul marino `#0D1B2A`, azul secundario `#23364D`, dorado `#D4A017`, crema `#F8F6F1`.

## Objetivo del producto

Crear una experiencia completa para informar, convertir y formar:

1. presentar el programa;
2. descargar la programación corporativa;
3. solicitar información o resolver dudas;
4. reservar una reunión informativa;
5. pagar 1.200 € mediante Stripe;
6. navegar por una base de conocimientos laboral;
7. diferenciar contenido público y material privado del alumno;
8. medir cada paso del embudo.

## Rutas requeridas

```text
/academy/gestion-laboral-integral
/docs/laboral
/docs/laboral/configuracion-inicial
/docs/laboral/convenio-tablas-salariales
/docs/laboral/alta-contratacion
/docs/laboral/nominas-mensuales
/docs/laboral/siltra-cotizaciones
/docs/laboral/variaciones
/docs/laboral/bajas-finiquitos
/docs/laboral/cierre-laboral
/downloads/academy/gestion-laboral-integral/programa-gestion-laboral-integral-expert.pdf
```

No rompas las URLs actuales de `/academy`, `/docs`, `/contacto` o `/cita`.

## Modelo de programa

Añade al catálogo Academy un segundo programa con:

```ts
{
  slug: 'gestion-laboral-integral',
  name: 'Programa personalizado de Gestión Laboral Integral',
  tagline: 'De la normativa a la ejecución autónoma',
  hoursTraining: 20,
  hoursTutoring: 5,
  hoursMaterials: 4,
  price: '1.200 €',
  value: '1.450 €',
  paymentLink: 'https://buy.stripe.com/6oU00kftqgMs9jU5gJ8EM0i',
  contactHref: '/contacto',
  meetingHref: '/cita',
  downloadHref: '/downloads/academy/gestion-laboral-integral/programa-gestion-laboral-integral-expert.pdf',
  languages: ['es', 'ru']
}
```

Amplía las interfaces sin romper el programa superior actual. Usa campos opcionales cuando solo apliquen a este curso.

## Landing del curso

Construye una ruta dinámica o una página dedicada reutilizando componentes Academy. La primera pantalla debe mostrar:

- nombre del programa;
- propuesta de valor;
- 20 horas de formación;
- 5 horas de tutorías incluidas;
- precio 1.200 €;
- CTA principal `Inscribirme y pagar`;
- CTA secundario `Solicitar información`;
- CTA terciario `Reservar reunión informativa`;
- enlace `Descargar programa`.

El orden de conversión debe ser:

1. pago directo para usuarios decididos;
2. formulario para dudas o interés;
3. entrevista para usuarios que necesitan validación previa;
4. descarga del programa como prueba documental.

## Contenido de la landing

Incluye estas secciones:

1. Hero y KPIs.
2. A quién va dirigido.
3. Resultados de aprendizaje.
4. Ecosistema operativo: Holded, Sistema RED / SILTRA y Creative Quality.
5. Programa de nueve módulos.
6. Metodología práctica.
7. Manuales y base de conocimientos.
8. Tutorías incluidas.
9. Inversión: valor 1.450 €, precio 1.200 €.
10. FAQ.
11. Formulario de interés.
12. CTA final con pago, contacto y reunión.

Usa el contenido de `content/academy/gestion-laboral/course.es.md` como fuente editorial.

## Stripe

Implementa primero el enlace de pago aprobado:

```text
https://buy.stripe.com/6oU00kftqgMs9jU5gJ8EM0i
```

Debe abrirse como navegación segura normal, sin copiar parámetros sensibles ni insertar claves en cliente. Añade `rel="noopener noreferrer"` cuando abra nueva pestaña.

Mantén preparado el modelo para migrar posteriormente a `stripePriceId` y `/api/academy/checkout`, pero no inventes un Price ID. No mezcles el Price ID del Programa Superior con este producto.

## Formulario y entrevista

- `Solicitar información` debe llevar al formulario específico del curso o reutilizar `AcademyLeadForm` con `programSlug="gestion-laboral-integral"`.
- Añade como motivo del lead: formación laboral, número aproximado de empleados, sector, herramientas actuales y duda principal.
- `Reservar reunión informativa` debe utilizar el flujo existente de Cal.com y tener fallback `/cita`.
- La reunión se comunica como gratuita y sin compromiso solo si el flujo configurado mantiene esas condiciones.

## Descarga

- Publica el PDF corporativo genérico, nunca el personalizado de Ilya.
- Usa el archivo estático indicado en `public/downloads/...` o adapta el endpoint PDF para servir el diseño corporativo equivalente.
- El nombre de descarga debe ser `programa-gestion-laboral-integral-expert.pdf`.
- Registra evento de descarga.

## Base de conocimientos

Implementa `/docs/laboral` con los Markdown de `content/academy/gestion-laboral/knowledge`.

Cada manual debe mostrar:

- estado: borrador, validado o pendiente de actualización;
- fecha de última revisión;
- finalidad;
- plazo;
- responsable;
- requisitos y documentos;
- instrucciones paso a paso;
- resultado esperado;
- justificantes que deben archivarse;
- controles posteriores;
- errores frecuentes;
- cuándo escalar a un profesional;
- fuentes oficiales.

Los contenidos marcados `access: public` son indexables. Los marcados `access: student` requieren autenticación y matrícula activa. No simules autorización únicamente ocultando enlaces en la interfaz; valida el acceso en servidor.

## Privacidad y datos de cliente

- No publiques nombres, NIF, CCC, NAF, salarios, contratos ni datos de trabajadores reales.
- No publiques el dossier ruso personalizado de Ilya Ovchinnikov.
- Todos los ejemplos deben ser ficticios o anonimizados.
- Las capturas deben ocultar datos personales y credenciales.

## SEO

- Canonical: `https://expertconsulting.es/academy/gestion-laboral-integral`.
- Título sugerido: `Curso de Gestión Laboral con Holded y SILTRA | EXPERT`.
- Descripción sugerida: `Formación práctica de 20 horas y 5 horas de tutoría para gestionar contratos, nóminas, cotizaciones, SILTRA, finiquitos y cierres laborales.`
- Añade JSON-LD `Course`, `Offer`, `Organization` y `BreadcrumbList`.
- No incluyas `Review` ni valoraciones inventadas.

## Analítica

Registra eventos sin datos personales:

```text
course_view
course_payment_click
course_contact_click
course_meeting_click
course_program_download
course_lead_submit
course_checkout_success
knowledge_article_view
knowledge_student_gate_view
```

Propiedades permitidas: `program_slug`, `locale`, `cta_location`, `article_slug`, `access_level`. No enviar nombres, emails, teléfonos ni mensajes.

## Accesibilidad y experiencia

- Contraste WCAG AA.
- Navegación completa por teclado.
- Foco visible.
- Encabezados jerárquicos.
- Botones con textos inequívocos.
- Formularios con labels y mensajes `aria-live`.
- PDFs y enlaces identificados por formato y destino.
- Diseño responsive desde 320 px.

## Pruebas requeridas

1. `npm run typecheck`.
2. `npm run lint`.
3. `npm test` si hay pruebas relacionadas.
4. `npm run build`.
5. Verificar que el enlace Stripe coincide exactamente.
6. Verificar descarga y `Content-Type: application/pdf`.
7. Verificar formulario, éxito y error.
8. Verificar fallback de reunión.
9. Verificar rutas públicas y privadas de `/docs/laboral`.
10. Verificar que ningún contenido personalizado de Ilya es público.

## Entregables de implementación

- código de las rutas y componentes;
- catálogo actualizado;
- contenido Markdown conectado al frontend;
- PDF público;
- pruebas;
- variables documentadas en `.env.example` sin secretos;
- actualización de sitemap;
- breve changelog;
- capturas de QA solo si el equipo solicita revisión visual.

## Restricciones

- No modifiques precios ni horas.
- No inventes un Stripe Price ID.
- No declares exención fiscal absoluta.
- No publiques datos reales de empleados.
- No rompas el Programa Superior existente.
- No dupliques formularios, checkout o utilidades si pueden ampliarse de forma compatible.
- No presentes como “gestión laboral 100 % automática”; la propuesta es formación para una gestión ordinaria documentada y supervisable.

## Criterio final de aceptación

Un visitante debe poder comprender el curso, descargar la programación, solicitar información, reservar una reunión o pagar en menos de dos minutos. Un alumno autorizado debe poder navegar los manuales privados, mientras que un visitante no matriculado solo accede a contenidos públicos y a la explicación comercial del programa.

