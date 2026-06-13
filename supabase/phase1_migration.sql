-- Merit Wears — Phase 1 Migration
-- Run this completely in your Supabase SQL Editor.
-- It is idempotent, you can run it multiple times safely.

-- 1. Extend orders table
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS whatsapp_sent,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),
  ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS monnify_transaction_ref TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS amount_expected NUMERIC(12,2)
    CHECK (amount_expected > 0),
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-update updated_at on every row change for orders
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Promo codes table
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,
  type             TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value            NUMERIC(10,2) NOT NULL CHECK (value > 0),
  max_uses         INTEGER CHECK (max_uses > 0),
  uses_count       INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  influencer_name  TEXT,
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS promo_codes_updated_at ON public.promo_codes;
CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Order tracking events table
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  created_by  UUID REFERENCES public.profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS policies
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Admins manage promo codes"
    ON public.promo_codes FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users read active promos"
    ON public.promo_codes FOR SELECT
    TO authenticated
    USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users see own order events"
    ON public.order_tracking_events FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.orders
         WHERE id = order_tracking_events.order_id
           AND user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON public.orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_monnify_ref ON public.orders(monnify_transaction_ref);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id ON public.order_tracking_events(order_id);

-- 6. RPCs
-- RPC 1 — confirm_payment
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_payment_reference TEXT,
  p_monnify_ref       TEXT,
  p_amount_paid       NUMERIC,
  p_payment_channel   TEXT,
  p_note              TEXT DEFAULT 'Payment verified via Monnify webhook'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order      public.orders;
  v_event_id   UUID;
BEGIN
  SELECT * INTO v_order
    FROM public.orders
   WHERE payment_reference = p_payment_reference
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'confirm_payment: order not found for reference %', p_payment_reference;
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid', 'order_id', v_order.id);
  END IF;

  IF p_amount_paid < v_order.amount_expected THEN
    RAISE EXCEPTION 'confirm_payment: amount mismatch — paid % expected %',
      p_amount_paid, v_order.amount_expected;
  END IF;

  UPDATE public.orders SET
    payment_status          = 'paid',
    status                  = 'confirmed',
    amount_paid             = p_amount_paid,
    monnify_transaction_ref = p_monnify_ref,
    payment_channel         = p_payment_channel
  WHERE id = v_order.id;

  INSERT INTO public.order_tracking_events(order_id, status, note)
  VALUES (v_order.id, 'confirmed', p_note)
  RETURNING id INTO v_event_id;

  IF v_order.promo_code IS NOT NULL THEN
    UPDATE public.promo_codes
       SET uses_count = uses_count + 1
     WHERE code = v_order.promo_code
       AND (max_uses IS NULL OR uses_count < max_uses);
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'order_id', v_order.id, 'event_id', v_event_id);
END;
$$;

-- RPC 2 — validate_promo
CREATE OR REPLACE FUNCTION public.validate_promo(
  p_code       TEXT,
  p_cart_total NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo    public.promo_codes;
  v_discount NUMERIC := 0;
  v_code     TEXT := upper(trim(p_code));
BEGIN
  SELECT * INTO v_promo
    FROM public.promo_codes
   WHERE code = v_code
     AND is_active = true
     AND (valid_until IS NULL OR valid_until > NOW())
     AND (valid_from  IS NULL OR valid_from  <= NOW());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'Invalid or expired code');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.uses_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'This code has reached its usage limit');
  END IF;

  IF p_cart_total < v_promo.min_order_amount THEN
    RETURN jsonb_build_object(
      'valid', false,
      'message', format(
        'Minimum order of ₦%s required for this code',
        to_char(v_promo.min_order_amount, 'FM999,999,999')
      )
    );
  END IF;

  IF v_promo.type = 'percentage' THEN
    v_discount := ROUND(p_cart_total * (v_promo.value / 100.0), 2);
  ELSE
    v_discount := LEAST(v_promo.value, p_cart_total);
  END IF;

  RETURN jsonb_build_object(
    'valid',           true,
    'discount_type',   v_promo.type,
    'discount_value',  v_promo.value,
    'discount_amount', v_discount,
    'final_amount',    p_cart_total - v_discount,
    'influencer',      v_promo.influencer_name,
    'normalized_code', v_code
  );
END;
$$;

-- RPC 3 — update_order_status
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id  UUID,
  p_status    TEXT,
  p_note      TEXT DEFAULT NULL,
  p_admin_id  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order       public.orders;
  v_valid_next  TEXT[];
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'update_order_status: order % not found', p_order_id;
  END IF;

  v_valid_next := CASE v_order.status
    WHEN 'pending'    THEN ARRAY['confirmed','cancelled']
    WHEN 'confirmed'  THEN ARRAY['processing','cancelled']
    WHEN 'processing' THEN ARRAY['shipped','cancelled']
    WHEN 'shipped'    THEN ARRAY['delivered']
    WHEN 'delivered'  THEN ARRAY[]::TEXT[]
    WHEN 'cancelled'  THEN ARRAY[]::TEXT[]
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (p_status = ANY(v_valid_next)) THEN
    RAISE EXCEPTION 'update_order_status: invalid transition % → % for order %',
      v_order.status, p_status, p_order_id;
  END IF;

  UPDATE public.orders SET status = p_status WHERE id = p_order_id;

  INSERT INTO public.order_tracking_events(order_id, status, note, created_by)
  VALUES (p_order_id, p_status, p_note, p_admin_id);

  RETURN jsonb_build_object('status', 'ok', 'new_status', p_status);
END;
$$;
