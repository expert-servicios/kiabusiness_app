# Implementación pública: servicio de renovación residencia inversor

Estado: implementación parcial + plan operativo  
Rama: `docs/inversor-sl-persona-juridica`

## Objetivo

Crear una ficha pública específica para la renovación de residencia de inversor Ley 14/2013 en régimen transitorio y enlazarla con:

- guía base general de renovación;
- guía específica de inmuebles a través de persona jurídica;
- artículo blog actualizado sobre renovación tras eliminación de golden visa;
- artículos relacionados del blog;
- guías de la base de conocimientos.

## Precio comercial confirmado

Honorarios profesionales:

- Titular inversor: 250 € + IVA.
- Cada familiar adicional: 90 € + IVA.

Costes externos no incluidos:

- Tasa administrativa 790 código 038.
- Tasa posterior 790 código 012 para TIE.
- Notas simples del Registro de la Propiedad.
- Certificaciones mercantiles.
- Certificados bancarios, registrales o administrativos.
- Informe PRIE / persona jurídica, si requiere gestión específica o costes externos.
- Traducciones juradas.
- Apostillas o legalizaciones.
- Antecedentes penales extranjeros.
- Recursos, subsanaciones complejas o requerimientos no previsibles.

## Stripe live creado

Cuenta Stripe: `Expert Consulting` / live mode.

Producto creado:

```text
prod_VFLKEXWrn0WJPM
Renovación residencia inversor Ley 14/2013
```

Prices creados:

```text
price_1UEqeQLeYwwgvux41KGKiDvF
lookup_key: renovacion_residencia_inversor_titular
importe: 250,00 EUR
IVA: tax_behavior exclusive
metadata:
  service_slug=renovacion-residencia-inversor
  role=titular
  base_amount_eur=250
  external_costs_excluded=true
```

```text
price_1UEqeULeYwwgvux4z8e8QOzi
lookup_key: renovacion_residencia_inversor_familiar
importe: 90,00 EUR
IVA: tax_behavior exclusive
metadata:
  service_slug=renovacion-residencia-inversor
  role=familiar
  base_amount_eur=90
  external_costs_excluded=true
```

## Decisión de cobro

Aunque existen prices Stripe, no se conecta todavía la landing a checkout directo.

Motivo: el importe final depende del número de familiares y pueden existir costes externos o complejidad adicional por SL, sociedades extranjeras, informe PRIE, antecedentes penales, traducciones, apostillas o requerimientos.

Flujo recomendado para producción inicial:

```text
Landing pública
→ Solicitud / revisión
→ Cotización admin personalizada
→ Enlace de pago Stripe desde admin
→ Expediente
```

El flujo admin de cotizaciones ya permite crear un enlace de pago Stripe con importe dinámico. Para mantener coherencia fiscal, si se expresa comercialmente como `+ IVA`, el importe final de la cotización debe calcularse correctamente antes de enviar el enlace.

Ejemplos operativos:

- Solo titular: 250 + IVA = 302,50 €.
- Titular + 1 familiar: 340 + IVA = 411,40 €.
- Titular + 2 familiares: 430 + IVA = 520,30 €.
- Titular + 3 familiares: 520 + IVA = 629,20 €.

## Landing pública implementada

Ruta:

```text
/servicios/extranjeria-nacionalidad/renovacion-residencia-inversor
```

Archivo:

```text
app/(public)/servicios/extranjeria-nacionalidad/renovacion-residencia-inversor/page.tsx
```

Contenido incluido:

- Enfoque correcto: renovación en régimen transitorio, no nueva golden visa inmobiliaria.
- Precio titular y familiares.
- Aviso de costes externos aparte.
- Checklist por bloques: titular, familiares, inversión inmobiliaria, persona jurídica/SL.
- Fuentes oficiales: UGE, renovaciones Ley 14/2013, BOE Ley 14/2013 y PRIE.
- CTAs: solicitar revisión y WhatsApp.
- Artículos relacionados del blog.
- Enlaces a base de conocimientos.

## Artículos incluidos en landing

- `/blog/permiso-residencia-inversores`
- `/blog/renovacion-permiso-residencia-espana`
- `/blog/documentos-permiso-residencia-espana`

## Base de conocimientos enlazada en landing

- `/docs/residencia-larga-duracion-nacional`
- `/docs/nacionalidad-espanola-menor-nacido-en-espana`
- `/docs`

## Pendiente antes de pasar a producción final

1. Revisar preview visual de la landing.
2. Decidir si se quiere publicar el artículo específico `renovar-residencia-inversor-inmuebles-sl-2026` en `lib/utils/blog.ts`.
3. Decidir si las guías nuevas deben integrarse en `lib/utils/docs.ts` como documentos públicos de base de conocimientos.
4. Mejorar el flujo admin de cotizaciones para separar base imponible, IVA y total, o documentar que el importe se introduce ya con IVA incluido.
5. Si más adelante se quiere checkout directo desde landing, usar los prices creados y resolver selección de número de familiares.