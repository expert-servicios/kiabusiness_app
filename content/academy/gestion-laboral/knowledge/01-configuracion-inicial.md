---
title: Configuración laboral inicial de la empresa en Holded
slug: configuracion-inicial
category: laboral
module: 4
access: student
status: review
updatedAt: 2026-08-24
readTime: 35 min
tags: [Holded, centro de trabajo, CCC, convenio, empleado, IRPF]
tools: [Holded Nóminas, Holded Equipo Pro]
sourcesVerifiedAt: 2026-08-24
reviewCycleDays: 90
---

# Configuración laboral inicial de la empresa en Holded

> **Estado:** revisión documental completada; pendiente de prueba funcional y capturas en una cuenta de formación.

## Finalidad

Configurar organización, centros, convenios y perfiles para que contratos, nóminas, cotización, finiquitos y contabilidad partan de datos coherentes.

## Cuándo se realiza

- antes de la primera nómina;
- al activar Nóminas o Equipo Pro;
- al incorporar un centro o CCC;
- al cambiar convenio o tabla salarial;
- al migrar desde otra aplicación;
- cuando una auditoría detecte datos incompletos.

## Responsable

Administración laboral ejecuta la configuración. Convenio, clasificación, salario y criterios dudosos requieren revisión profesional.

## Permisos y módulos

- rol administrativo;
- gema **Nóminas**;
- gema **Equipo Pro** cuando se utilicen Contratos;
- permisos de RR. HH., Nóminas, Contabilidad y Tesorería según funciones.

Holded indica que una asesoría necesita rol administrador en la cuenta del cliente para activar la gema desde Holded Store.

## Documentación previa

### Empresa y centros

- NIF, razón social y domicilio fiscal;
- titular o representante;
- centros y direcciones;
- CCC, régimen, CNAE y administración TGSS;
- convenio y código oficial;
- calendario de festivos;
- IBAN de pago y cuentas contables.

### Trabajadores

- identificación, contacto y NAF;
- contrato firmado y alta TGSS;
- centro, puesto, grupo/categoría y jornada;
- salario, pagas y complementos;
- modelo 145, IBAN y, en migraciones, acumulados.

## Procedimiento paso a paso

### 1. Verificar acceso y gemas

1. Entrar en la empresa correcta y comprobar nombre y NIF.
2. Revisar rol y permisos.
3. Confirmar Nóminas y, si procede, Equipo Pro.
4. Registrar fecha, usuario y entorno.

**Control:** no continuar si cuenta, empresa o permisos son incorrectos.

**Captura:** `holded-configuracion-00-cuenta-y-gemas-2026-08.webp`.

### 2. Crear o revisar el centro

1. Abrir **Configuración**.
2. Ir a **RR. HH. > Organización**.
3. Localizar **Centros de trabajo**.
4. Pulsar **+ Añadir centro de trabajo** o abrir uno existente.
5. Completar nombre, dirección y datos básicos.
6. Guardar y pulsar **Configurar centro**.

**Capturas:** `holded-centro-01-listado-2026-08.webp` y `holded-centro-02-datos-generales-2026-08.webp`.

### 3. Completar el centro

Revisar:

1. **Datos generales:** domicilio y titular/representante.
2. **Festivos:** nacionales, autonómicos y locales.
3. **Seguridad Social:** identificación y CCC.
4. **Convenio:** código asignado al centro.
5. **Extras:** pagas y conceptos.
6. **Cálculo:** finiquitos, indemnizaciones y bajas disponibles.
7. **Antigüedad:** reglas y fechas cuando procedan.

**Control:** contrastar CCC, CNAE, régimen y convenio con documentación externa.

**Capturas:** `holded-centro-03-seguridad-social-2026-08.webp` y `holded-centro-04-extras-calculo-2026-08.webp`.

### 4. Crear o versionar el convenio

1. Ir a **Configuración > RR. HH. > Organización > Convenios**.
2. Pulsar **Nuevo convenio**.
3. Buscar uno existente o crear configuración manual cuando proceda.
4. Informar fecha de entrada en vigor.
5. Para una nueva tabla, crear nueva versión; no modificar la histórica.
6. Añadir categorías, grupos y tablas.
7. Configurar pagas extraordinarias.
8. Guardar y asignar al centro.

**Control:** la versión debe corresponder al periodo de la nómina. Conservar versiones anteriores para atrasos.

**Capturas:** `holded-convenio-01-listado-2026-08.webp`, `holded-convenio-02-version-vigencia-2026-08.webp`, `holded-convenio-03-categorias-tabla-2026-08.webp` y `holded-convenio-04-pagas-extra-2026-08.webp`.

### 5. Configurar categorías y tabla

Por cada categoría:

1. Introducir descripción y grupo profesional.
2. Añadir salario base y complementos obligatorios.
3. Definir cada concepto como fijo o variable.
4. Informar periodicidad e importe.
5. Revisar naturaleza y tratamiento en nómina.
6. Repetir para todas las categorías utilizadas.

**Control profesional:** Holded no decide la categoría ni valida compensación y absorción.

### 6. Crear y asignar el empleado

1. Ir a **RR. HH. > Empleados > Nuevo empleado**.
2. Completar nombre, apellidos, equipo y centro.
3. Decidir si se facilita acceso a **Mi zona**.
4. Crear el perfil.
5. Alternativamente, usar **Asignar empleado** desde el centro.

El convenio del centro se asigna al empleado. Confirmar que el centro sea correcto.

**Capturas:** `holded-empleado-01-nuevo-2026-08.webp` y `holded-empleado-02-centro-equipo-2026-08.webp`.

### 7. Completar las pestañas del perfil

Abrir el empleado, pulsar los tres puntos y **Editar**. Completar y guardar:

1. **Datos:** filiación, contacto, banco y datos personales.
2. **Organización:** puesto, horario, ausencias, supervisor, equipo y centro.
3. **IRPF:** situación personal, familiar y económica.
4. **Nómina:** salario, pagas y conceptos.
5. **Cotización/Acumulados:** Seguridad Social y saldos migrados.
6. **Contabilidad:** cuentas aplicables.

No almacenar documentación sensible en observaciones libres si existe un repositorio más seguro.

### 8. Calcular y aplicar el IRPF

1. Completar datos personales, familiares y económicos.
2. Pulsar **Calcular IRPF**.
3. Revisar vista previa, base, mínimos, reducciones y porcentaje.
4. Comparar con el modelo 145 y cambios del ejercicio.
5. Pulsar **Aplicar IRPF** solo después de revisar.
6. Guardar criterio y fecha.

La automatización no sustituye revisar el modelo 145 ni futuras regularizaciones.

**Capturas:** `holded-empleado-03-datos-irpf-2026-08.webp` y `holded-empleado-04-vista-previa-irpf-2026-08.webp`.

### 9. Aplicar la tabla salarial

1. Abrir **Empleados** y seleccionar al trabajador.
2. Entrar en **Editar > Nómina**.
3. Confirmar centro, convenio y categoría.
4. Pulsar **Ajustar a bruto**.
5. Revisar los conceptos cargados.
6. Comparar con contrato, jornada y tabla.
7. Pulsar **Aplicar** si el resultado es correcto.

Documentar diferencias entre bruto contractual y mínimo de convenio. No reducir automáticamente salarios superiores.

**Capturas:** `holded-empleado-05-nomina-ajustar-bruto-2026-08.webp` y `holded-empleado-06-conceptos-aplicados-2026-08.webp`.

### 10. Revisar el contrato interno

1. Crear o abrir el contrato en **RR. HH. > Contratos**.
2. Revisar tipo, fecha, puesto, jornada y salario.
3. Comparar con alta TGSS y contrato firmado.
4. Simular la nómina si la función está disponible.
5. Corregir antes de aprobar.
6. Aprobar al finalizar: Holded documenta que queda bloqueado.

El contrato de Holded no sustituye firma ni Contrat@.

### 11. Generar una nómina de prueba

1. Crear borrador del periodo acordado sin aprobar.
2. Revisar salario, complementos, pagas, bases, cotización, IRPF y neto.
3. Comparar con cálculo manual o nómina validada.
4. Corregir la configuración de origen.
5. Repetir hasta resolver diferencias.

## Resultado esperado

Centros y convenios versionados; perfiles completos; contratos coherentes; tabla e IRPF revisados; y nómina de prueba sin diferencias pendientes.

## Evidencias y archivo

- checklist firmado;
- inventario de centros, CCC y convenios;
- perfiles revisados;
- matriz de categorías y salarios;
- incidencias y decisiones;
- nómina de prueba marcada como borrador;
- fecha y persona revisora.

## Checklist de aceptación

- [ ] Empresa, NIF, gemas y permisos correctos.
- [ ] Centros completos y CCC contrastados.
- [ ] Convenio y versión vigentes.
- [ ] Categorías y pagas configuradas.
- [ ] Empleados asignados al centro correcto.
- [ ] NAF, jornada, salario, grupo y categoría revisados.
- [ ] IRPF calculado con información actualizada.
- [ ] Contratos coinciden con TGSS y documento firmado.
- [ ] Nómina de prueba revisada sin aprobar.
- [ ] Evidencias archivadas de forma segura.

## Errores frecuentes

- editar la tabla antigua en vez de versionarla;
- convenio, centro o CCC incorrectos;
- contrato activo pero no aprobado para SILTRA;
- salario anual introducido como mensual;
- pagas duplicadas o mal prorrateadas;
- IRPF calculado con datos incompletos;
- aceptar **Ajustar a bruto** sin revisar;
- aprobar contrato o nómina demasiado pronto.

## Cuándo detenerse

Si falta convenio, hay duda de ámbito o categoría, salario inferior a tabla, funciones mixtas, migración sin acumulados fiables, diferencias TGSS, alta fuera de plazo o IRPF incoherente.

## Fuentes del proveedor

- [Configurar un centro de trabajo](https://help.holded.com/es/articles/9991873-como-crear-configurar-y-gestionar-un-centro-de-trabajo-en-holded)
- [Crear y configurar convenios](https://help.holded.com/es/articles/15435116-como-crear-y-configurar-los-convenios-en-holded)
- [Crear el perfil de un empleado](https://help.holded.com/es/articles/6930320-como-crear-el-perfil-de-un-empleado-en-holded)
- [Calcular automáticamente el IRPF](https://help.holded.com/es/articles/14134022-como-calcular-el-irpf-de-tus-empleados-de-forma-automatica)
- [Crear contratos](https://help.holded.com/es/articles/10484753-como-crear-contratos)
- [Del contrato a la nómina automatizada](https://help.holded.com/es/articles/13386213-paso-a-paso-del-contrato-a-la-nomina-automatizada)

## Historial de cambios

- 2026-08-24: convertido en SOP con documentación Holded 2026.
