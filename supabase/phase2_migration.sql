-- Merit Wears — Phase 2 Migration (Addendum to Phase 1)
-- Run this in your Supabase SQL Editor AFTER phase1_migration.sql.
-- It is idempotent, you can run it multiple times safely.

-- Add idempotency_hash column (used to detect duplicate checkout submissions)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS idempotency_hash TEXT,
  ADD COLUMN IF NOT EXISTS checkout_url TEXT;

-- Index for fast idempotency lookup
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_hash ON public.orders(idempotency_hash);
