# Arquitectura técnica propuesta

## Principio

Extender los componentes Academy y Docs existentes sin crear un micrositio separado.

## Cambios recomendados

```text
app/(public)/academy/[slug]/page.tsx
app/(public)/docs/laboral/page.tsx
app/(public)/docs/laboral/[slug]/page.tsx
app/api/academy/leads/route.ts                 # ampliar validación de campos
components/site/AcademyLeadForm.tsx            # admitir variante por programa
components/site/AcademyProgramPage.tsx         # nuevo componente reutilizable
components/docs/LaborKnowledgeNav.tsx          # índice por módulo y acceso
lib/data/academy-catalog.ts                     # segundo programa
lib/content/labor-knowledge.ts                  # loader y validación de frontmatter
lib/auth/course-access.ts                       # autorización server-side
content/academy/gestion-laboral/**              # fuentes Markdown
public/downloads/academy/gestion-laboral-integral/*.pdf
```

## Catálogo

Ampliar `AcademyProgram` con campos opcionales:

```ts
interface AcademyProgram {
  hoursTutoring?: number;
  hoursMaterials?: number;
  value?: string;
  paymentLink?: string;
  contactHref?: string;
  meetingHref?: string;
  downloadHref?: string;
  knowledgeBaseHref?: string;
  tools?: string[];
  included?: string[];
  exclusions?: string[];
}
```

No convertir el Programa Superior en un caso especial dentro de la nueva página. Crear una representación reutilizable con secciones configurables.

## Contenido Markdown

Usar frontmatter validado con Zod:

```yaml
title: Alta y contratación de un trabajador
slug: alta-contratacion
category: laboral
module: 5
access: student
status: draft
updatedAt: 2026-08-24
readTime: 15 min
tags:
  - Sistema RED
  - Contrat@
  - Holded
```

El loader debe:

1. leer solo el directorio permitido;
2. validar campos;
3. ordenar por `module` y título;
4. rechazar slugs duplicados;
5. no renderizar HTML arbitrario sin sanitización;
6. distinguir `public` y `student` en servidor.

## Autorización

El contenido privado no debe depender de una clase CSS o de una decisión exclusiva del cliente.

Flujo recomendado:

1. obtener usuario autenticado en servidor;
2. consultar matrícula o entitlement;
3. comprobar programa `gestion-laboral-integral` y estado activo;
4. renderizar contenido o vista de acceso;
5. registrar auditoría mínima sin almacenar contenido sensible.

## Stripe

Fase inicial: `paymentLink` externo aprobado.  
Fase posterior: `stripePriceId` y checkout interno con sesión y perfil.

No poner `STRIPE_SECRET_KEY` en variables públicas. El enlace de pago no es secreto y puede estar en catálogo, pero se recomienda centralizarlo para evitar divergencias.

## Descargas

La opción estática evita regeneración y garantiza fidelidad del diseño aprobado. Configurar:

- `Content-Type: application/pdf`;
- nombre de archivo estable;
- caching público con revalidación cuando cambie la versión;
- evento de analítica en clic;
- versión del documento visible en metadatos o nombre interno.

## Compatibilidad

- Mantener `/academy` funcionando.
- Mantener el endpoint PDF actual para el Programa Superior.
- Añadir el nuevo PDF estático sin reemplazar el generador existente.
- Mantener la estructura actual de `/docs` y sus redirecciones.

