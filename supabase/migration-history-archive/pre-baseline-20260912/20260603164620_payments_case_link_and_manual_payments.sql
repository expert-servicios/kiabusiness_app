-- Recovered verbatim from production migration ledger (#143).
ALTER TABLE orders ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_case_id_idx ON orders(case_id) WHERE case_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS manual_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  amount_eur NUMERIC(12,2) NOT NULL CHECK (amount_eur > 0),
  currency TEXT NOT NULL DEFAULT 'EUR',
  payment_method TEXT NOT NULL DEFAULT 'transferencia',
  description TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reference TEXT,
  holded_invoice_id TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS manual_payments_client_idx ON manual_payments(client_id);
CREATE INDEX IF NOT EXISTS manual_payments_case_idx ON manual_payments(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS manual_payments_paid_at_idx ON manual_payments(paid_at DESC);
ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON manual_payments USING (false) WITH CHECK (false);
