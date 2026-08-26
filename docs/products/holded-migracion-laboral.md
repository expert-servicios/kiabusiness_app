# Producto: Migración laboral a Holded

Estado: listo para publicación comercial. Checkout unitario pendiente de crear en Stripe.

## Posicionamiento

Servicio puntual de implantación. EXPERT configura y valida en Holded la situación laboral vigente de cada empleado. No es formación, asesoramiento jurídico ni gestión mensual de nóminas.

## Precio

- 50 € + IVA por empleado.
- Pedido mínimo: 5 empleados, equivalente a 250 € + IVA.
- Para 11 empleados: 550 € + 115,50 € de IVA = 665,50 €.
- El número facturable se confirma tras una revisión previa de 15 minutos.

## Alcance incluido por empleado

1. Revisión de contrato, nómina vigente, IDC y datos facilitados.
2. Creación o validación del perfil de empleado en Holded.
3. Centro de trabajo, CCC y convenio ya configurados.
4. Contrato, categoría, grupo, jornada y antigüedad.
5. Estructura salarial, pagas extraordinarias e IRPF.
6. Comprobación del código de ocupación CNO cuando proceda.
7. Carga del contrato vigente y documentación acordada.
8. Nómina de prueba y control de coherencia.
9. Registro de incidencias y checklist de entrega.

## Exclusiones

- Regularización o recálculo de nóminas históricas.
- Atrasos y liquidaciones complementarias.
- Altas, bajas o variaciones ante TGSS.
- Contrat@, Certific@2 u otras comunicaciones al SEPE.
- Envíos mediante SILTRA y gestión laboral mensual.
- Reconstrucción de expedientes incompletos.
- Asesoramiento jurídico sobre contratación o conflictos.
- Licencia de Holded.

## Reglas operativas

- No solicitar CCC, NAF, nóminas, documentos de identidad ni credenciales por formularios comerciales, WhatsApp o email.
- La documentación se recibe únicamente mediante el portal seguro.
- Si un expediente contiene datos contradictorios, se detiene y se registra como incidencia; no se completa por inferencia.
- Para hasta 15 empleados, el plazo orientativo es de 3 a 5 días hábiles desde la recepción completa.
- La entrega incluye informe de migración, incidencias y nómina de prueba; no implica conformidad jurídica de la relación laboral.

## Conversión y Stripe

Mientras no exista un Price ID unitario, la página dirige a:

1. `Pedir revisión previa — 15 min` mediante el flujo de Cal.com existente.
2. `Solicitar propuesta` con `servicio=holded-migracion-laboral`.
3. `Resolver una duda` mediante el formulario de contacto.

Para habilitar el checkout directo:

- crear en Stripe un producto `Migración laboral a Holded`;
- crear un precio unitario de 50 € sin IVA incluido;
- configurar el código fiscal y el IVA automático del 21 %;
- permitir cantidad entera, mínimo 5;
- confirmar en servidor que `quantity` coincide con la plantilla aceptada;
- guardar en metadata `service_slug=holded-migracion-laboral` y `unit=employee`.

No se debe reutilizar el Price ID de `Módulo Laboral Holded` (180 €), porque el alcance y la unidad de facturación son distintos.

## Dos alternativas para una empresa de 11 empleados

| Alternativa | Quién ejecuta | Resultado | Precio |
|---|---|---|---:|
| Programa de Gestión Laboral Integral | La empresa aprende y ejecuta con supervisión | Autonomía operativa, 20 h de formación + 5 h de tutorías | 1.200 € según condiciones fiscales del programa |
| Migración laboral a Holded | EXPERT ejecuta la implantación inicial | 11 perfiles migrados, comprobados y documentados | 550 € + IVA; total 665,50 € |

No presentar la migración como una versión reducida del curso. Resuelven necesidades distintas y pueden contratarse posteriormente de forma complementaria.
