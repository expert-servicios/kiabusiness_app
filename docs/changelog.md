# Changelog

## 2026-05-03

- Añadida migración `supabase/migrations/20260503120000_add_orders_table.sql` para crear la tabla `orders`.
- Actualizado `app/api/stripe/webhook/route.ts` para:
  - registrar la orden tras `checkout.session.completed`
  - actualizar el estado de `quotes` a `paid`
  - crear un `case` vinculado cuando el cliente exista
- Corregido `components/site/footer.tsx` para usar iconos soportados por `lucide-react`.
- Verificación exitosa con `npm run build`.
