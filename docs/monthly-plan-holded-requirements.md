# Plan Mensual — Requisito Holded Obligatorio

> Última actualización: 2026-05-23

## Regla principal

> **Un cliente NO puede contratar un plan mensual de gestión sin tener Holded conectado y con integración activa.**

Esta es una decisión funcional cerrada. No hay excepciones en el flujo de checkout.

## Definición de "plan mensual"

Servicios que requieren Holded activo:

| service_id | Nombre |
|-----------|--------|
| `svc_gestion_mensual` | Gestión mensual empresa |
| `svc_autonomo_gestion` | Autónomo / IVA trimestral (gestión continua) |

Los planes puntuales (IRPF, arraigo, certificado, etc.) **no** requieren Holded.

## Flujo completo de alta plan mensual

```
Lead interesado en plan mensual
          │
          ▼
Kia en WhatsApp (precal + perfil)
          │
          ▼
Kia pregunta: "¿Tienes licencia Holded activa?"
     │              │
    NO              SÍ
     │              │
     ▼              ▼
Kia envía:    Kia pregunta: "¿Puedes obtener
link prueba   tu API key de Holded?"
14 días           │              │
     │            SÍ             NO
     │             │              │
     │             │          Kia envía tutorial
     │             │          Holded Academy/API docs
     │             │              │
     └─────────────┴──────────────┘
                   │
                   ▼
          Lead va al portal EXPERT
          /auth/login o /auth/register
                   │
                   ▼
          Completa perfil (billing_ready)
                   │
                   ▼
          Va a /dashboard/integraciones/holded
          Introduce API key → se verifica
                   │
             ┌─────┴─────┐
           Error         OK
             │            │
             ▼            ▼
       Kia orienta   Integración activa
       al cliente    (client_integrations
                     status='active')
                          │
                          ▼
                  Checkout desbloqueado
                  /contratar?service=svc_gestion_mensual
                          │
                          ▼
                  Stripe procesa pago
                          │
                          ▼
                  Expediente creado
                  has_monthly_plan = true en profiles
```

## Bloqueo en checkout

El componente `ProfileCompletionWizard` y la API de checkout verifican:

```typescript
// lib/checkout/plan-mensual-guard.ts
async function canCheckoutMonthlyPlan(userId: string): Promise<{
  allowed: boolean;
  reason?: 'no_holded' | 'holded_error' | 'profile_incomplete' | 'billing_incomplete';
}> {
  const admin = getSupabaseAdmin();
  
  // 1. Perfil completo
  const { data: profile } = await admin
    .from('profiles')
    .select('profile_completed, billing_ready')
    .eq('id', userId)
    .single();
  
  if (!profile?.profile_completed) return { allowed: false, reason: 'profile_incomplete' };
  if (!profile?.billing_ready) return { allowed: false, reason: 'billing_incomplete' };
  
  // 2. Holded activo
  const { data: integration } = await admin
    .from('client_integrations')
    .select('status')
    .eq('client_id', userId)
    .eq('provider', 'holded')
    .neq('status', 'revoked')
    .maybeSingle();
  
  if (!integration) return { allowed: false, reason: 'no_holded' };
  if (integration.status !== 'active') return { allowed: false, reason: 'holded_error' };
  
  return { allowed: true };
}
```

## Mensajes al usuario por bloqueo

| reason | Mensaje mostrado |
|--------|-----------------|
| `no_holded` | "Para contratar el plan mensual necesitas conectar Holded. [Conectar Holded →]" |
| `holded_error` | "Tu conexión con Holded tiene un error. Revísala antes de continuar. [Ver integración →]" |
| `profile_incomplete` | "Completa tu perfil antes de contratar. [Completar perfil →]" |
| `billing_incomplete` | "Añade tus datos de facturación antes de continuar. [Completar →]" |

## Kia en WhatsApp — Script de Holded

Cuando un lead pregunta por planes mensuales:

```
1. Kia explica el servicio
2. Kia pregunta si tiene Holded
3. Si NO: envía link https://www.holded.com/es (prueba 14 días)
4. Si SÍ: pregunta si puede obtener API key
5. Si no sabe: envía tutorial (URL de Academy de Holded)
6. En todos los casos: invita a registrarse en EXPERT para conectar Holded
7. Kia NO pide la API key por WhatsApp bajo ninguna circunstancia
```

## Consecuencias de desconectar Holded (cliente activo)

Si un cliente con plan mensual revoca la integración Holded:

1. `client_integrations.status` → 'revoked'
2. `profiles.has_monthly_plan` **no cambia** (el contrato sigue activo)
3. Se crea NBA: "Cliente {nombre} ha desconectado Holded. Plan mensual activo."
4. Se crea tarea interna: "Contactar a {nombre} — sin Holded conectado" (prioridad ALTA)
5. Dashboard Estado de empresa muestra: "Reconecta Holded para ver tus datos"
6. **No** se cancela el cobro automáticamente — Ksenia decide.

## Clientes puntuales — restricción

Los clientes con servicios puntuales (IRPF, arraigo, etc.) **no deben**:
- Ver la sección de integración Holded en su dashboard.
- Recibir mensajes de Kia sobre Holded.
- Poder conectar Holded aunque lo intenten manualmente.

Implementación: la página `/dashboard/integraciones/holded` verifica que el cliente tenga plan mensual activo. Si no, redirige a `/dashboard` con mensaje: "Esta integración está disponible para clientes con plan mensual de gestión."
