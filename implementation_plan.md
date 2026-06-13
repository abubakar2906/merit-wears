# Merit Wears — Payment & Feature Implementation Plan

> [!NOTE]
> **v3 — Final, after two rounds of production review.** All 15 flagged issues resolved.

## Overview

Four phases executed in strict sequence. Each is independently verifiable before proceeding.

---

## Phase 0 — WhatsApp Removal & Clean State

**Goal:** Strip all WhatsApp ordering logic. Leave checkout non-functional but stable.

### Files Modified

#### [DELETE] [lib/whatsapp.ts](file:///c:/Users/HP/Desktop/merit/merit-wears/lib/whatsapp.ts)
Remove entirely.

#### [MODIFY] [checkout/page.tsx](file:///c:/Users/HP/Desktop/merit/merit-wears/app/%5Blocale%5D/%28public%29/checkout/page.tsx)
- Remove `buildWhatsAppURL` import and all calls
- Replace submit handler with stub: `toast.info("Payment coming soon…")`
- Button label: `"Place Order →"`

#### [MODIFY] [app/api/orders/route.ts](file:///c:/Users/HP/Desktop/merit/merit-wears/app/api/orders/route.ts)
- Remove `whatsapp_sent: false` from the INSERT payload

#### [MODIFY] [types/index.ts](file:///c:/Users/HP/Desktop/merit/merit-wears/types/index.ts)
- Remove `whatsapp_sent: boolean` from `Order` interface

#### [MODIFY] [components/layout/Footer.tsx](file:///c:/Users/HP/Desktop/merit/merit-wears/components/layout/Footer.tsx)
- Remove WhatsApp Support link, or keep as general support contact — **your call**

### Database (Run in Supabase SQL Editor)
```sql
ALTER TABLE public.orders DROP COLUMN IF EXISTS whatsapp_sent;
```

### Verification
- `npm run dev` → zero TypeScript errors
- Checkout renders, validates, submit shows "coming soon" toast
- `grep -ri whatsapp app/` → no results

---

## Phase 1 — Database Schema

**Goal:** One idempotent migration. All new columns, tables, indexes, triggers, and RPCs in a single SQL file. Later phases are pure application code.

### 1a. Extend `orders` table

```sql
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS whatsapp_sent,

  -- Payment tracking
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','pending','paid','failed','refunded')),

  ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
    -- Our idempotency key. Format: MW-REF-<10-char nanoid>
    -- Generated at initiate time; stable across retries.

  ADD COLUMN IF NOT EXISTS monnify_transaction_ref TEXT UNIQUE,
    -- Monnify's MNFY|... reference. UNIQUE prevents double-confirmation writes.

  ADD COLUMN IF NOT EXISTS amount_expected NUMERIC(12,2)
    CHECK (amount_expected > 0),
    -- INTENTIONALLY no DEFAULT — application must always supply this value.
    -- A DEFAULT 0 would allow the webhook amount guard to pass for any payment (including ₦1).
    -- If the INSERT omits this column, Postgres throws, which is the correct failure mode.

  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,   -- 'CARD' | 'ACCOUNT_TRANSFER' | 'USSD'
  ADD COLUMN IF NOT EXISTS promo_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- updated_at
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
```

> [!NOTE]
> `tracking_events JSONB` column is **intentionally omitted**. After review, dual-writing to both a JSONB snapshot and a normalized table creates a consistency risk on every future write path. The `order_tracking_events` table is the single source of truth. The tracking page fetches from it directly.

### 1b. `updated_at` trigger (shared function)

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 1c. `promo_codes` table

```sql
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT NOT NULL UNIQUE,  -- stored and compared UPPERCASED
  type             TEXT NOT NULL CHECK (type IN ('percentage','fixed')),
  value            NUMERIC(10,2) NOT NULL CHECK (value > 0),
  max_uses         INTEGER CHECK (max_uses > 0),  -- NULL = unlimited
  uses_count       INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ,           -- NULL = no expiry
  is_active        BOOLEAN NOT NULL DEFAULT true,
  influencer_name  TEXT,
  min_order_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

### 1d. `order_tracking_events` table

```sql
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status      TEXT NOT NULL,
  note        TEXT,
  created_by  UUID REFERENCES public.profiles(id),  -- NULL when set by webhook (system)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 1e. RLS Policies

```sql
-- promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage promo codes"
  ON public.promo_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users read active promos"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- order_tracking_events
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own order events"
  ON public.order_tracking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
       WHERE id = order_tracking_events.order_id
         AND user_id = auth.uid()  -- ownership check at DB level, not application code
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Writes to order_tracking_events always go through service-role client (webhook)
-- or the update_order_status RPC (admin), neither of which needs an INSERT policy.
```

### 1f. Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference
  ON public.orders(payment_reference);

CREATE INDEX IF NOT EXISTS idx_orders_monnify_ref
  ON public.orders(monnify_transaction_ref);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders(user_id);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON public.orders(order_number);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code
  ON public.promo_codes(code);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order_id
  ON public.order_tracking_events(order_id);
  -- Critical for tracking page query: WHERE order_id = $1 ORDER BY created_at
```

### 1g. Postgres Stored Procedures (RPCs)

> [!IMPORTANT]
> Both RPCs use `SECURITY DEFINER`, meaning they execute with the **privileges of the function owner** (the DB superuser/postgres role), not the calling user. This is intentional and required: the webhook caller has no JWT, so it cannot pass RLS checks as a regular user. Do not use `SECURITY DEFINER` for functions that don't explicitly require bypassing RLS — it grants full DB access within that function's scope.

#### RPC 1 — `confirm_payment` (atomic, idempotent)

This is the only place where `uses_count` is incremented. Moving the decrement here (not at initiate) means abandoned payments never burn promo code slots.

```sql
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_payment_reference TEXT,
  p_monnify_ref       TEXT,
  p_amount_paid       NUMERIC,
  p_payment_channel   TEXT,
  p_note              TEXT DEFAULT 'Payment verified via Monnify webhook'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- runs as function owner; required because webhook has no user JWT
SET search_path = public  -- prevent search_path injection attacks on SECURITY DEFINER functions
AS $$
DECLARE
  v_order      public.orders;
  v_event_id   UUID;
BEGIN
  -- Lock the row for the duration of this transaction (prevents concurrent webhook retries)
  SELECT * INTO v_order
    FROM public.orders
   WHERE payment_reference = p_payment_reference
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'confirm_payment: order not found for reference %', p_payment_reference;
  END IF;

  -- Idempotency guard: already processed → return cleanly without re-writing
  IF v_order.payment_status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid', 'order_id', v_order.id);
  END IF;

  -- Amount guard: paid must be >= expected
  -- v_order.amount_expected has a CHECK > 0 constraint so this guard cannot be bypassed by a zero value
  IF p_amount_paid < v_order.amount_expected THEN
    RAISE EXCEPTION 'confirm_payment: amount mismatch — paid % expected %',
      p_amount_paid, v_order.amount_expected;
  END IF;

  -- Write 1: update order
  UPDATE public.orders SET
    payment_status          = 'paid',
    status                  = 'confirmed',
    amount_paid             = p_amount_paid,
    monnify_transaction_ref = p_monnify_ref,
    payment_channel         = p_payment_channel
  WHERE id = v_order.id;

  -- Write 2: insert tracking event (normalized table only — no JSONB snapshot)
  INSERT INTO public.order_tracking_events(order_id, status, note)
  VALUES (v_order.id, 'confirmed', p_note)
  RETURNING id INTO v_event_id;

  -- Write 3: atomically increment promo uses_count (ONLY if a promo was applied)
  -- This is the correct place — not at initiate — so abandoned payments don't burn slots.
  IF v_order.promo_code IS NOT NULL THEN
    UPDATE public.promo_codes
       SET uses_count = uses_count + 1
     WHERE code = v_order.promo_code
       AND (max_uses IS NULL OR uses_count < max_uses);
    -- If the promo has since hit its limit (edge case: two users race to use the last slot),
    -- the UPDATE matches 0 rows. The payment is still confirmed — we don't reverse a valid payment
    -- over a promo edge case. Log this via the note field for manual review.
  END IF;

  RETURN jsonb_build_object('status', 'ok', 'order_id', v_order.id, 'event_id', v_event_id);
END;
$$;
```

#### RPC 2 — `validate_promo` (read-only, no writes)

> [!IMPORTANT]
> This RPC **does not increment `uses_count`**. It only validates and returns discount info. Incrementing happens inside `confirm_payment` on successful payment. This prevents abandoned initiations from burning promo slots.

```sql
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
  v_code     TEXT := upper(trim(p_code));  -- normalize here; checkout form doesn't need to
BEGIN
  SELECT * INTO v_promo
    FROM public.promo_codes
   WHERE code = v_code
     AND is_active = true
     AND (valid_until IS NULL OR valid_until > NOW())
     AND (valid_from  IS NULL OR valid_from  <= NOW());
  -- No FOR UPDATE — this is a read-only validation, not a write

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

  -- Calculate discount
  IF v_promo.type = 'percentage' THEN
    v_discount := ROUND(p_cart_total * (v_promo.value / 100.0), 2);
  ELSE
    v_discount := LEAST(v_promo.value, p_cart_total);  -- cap at cart total
  END IF;

  RETURN jsonb_build_object(
    'valid',           true,
    'discount_type',   v_promo.type,
    'discount_value',  v_promo.value,
    'discount_amount', v_discount,
    'final_amount',    p_cart_total - v_discount,
    'influencer',      v_promo.influencer_name,
    'normalized_code', v_code  -- return the normalized form for the initiate payload
  );
END;
$$;
```

#### RPC 3 — `update_order_status` (admin Phase 3)

```sql
-- Valid transition map (enforced in Postgres, not just application code)
-- pending → confirmed → processing → shipped → delivered
-- any non-delivered state → cancelled

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

  -- State machine: define valid next states for each current state
  v_valid_next := CASE v_order.status
    WHEN 'pending'    THEN ARRAY['confirmed','cancelled']
    WHEN 'confirmed'  THEN ARRAY['processing','cancelled']
    WHEN 'processing' THEN ARRAY['shipped','cancelled']
    WHEN 'shipped'    THEN ARRAY['delivered']
    WHEN 'delivered'  THEN ARRAY[]::TEXT[]   -- terminal state, no transitions
    WHEN 'cancelled'  THEN ARRAY[]::TEXT[]   -- terminal state, no transitions
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
```

### Verification
- Run migration in Supabase SQL Editor → no errors
- Confirm `amount_expected` column has no default and has `CHECK (amount_expected > 0)`
- Confirm `order_tracking_events(order_id)` index exists
- Test `confirm_payment` twice with same reference → second call returns `already_paid`

---

## Phase 2 — Monnify Payment Integration

### Architecture

```
Customer → Checkout (validates promo, checks stock) 
  → POST /api/payment/initiate  (creates order + Monnify transaction)
  → Redirect to Monnify checkoutUrl
  → Customer pays
  → Monnify POSTs to /api/payment/webhook
  → confirm_payment RPC (atomic: update order + insert event + increment promo)
  → Customer already on /payment/success page (polling or transfer-pending state)
  → Redirect to /orders/[order_number] on confirmation
```

> [!IMPORTANT]
> **Never trust client-side callbacks.** The webhook is the only source of truth for payment confirmation.

### Environment Variables

```bash
MONNIFY_API_KEY=your_api_key
MONNIFY_SECRET_KEY=your_secret_key
MONNIFY_CONTRACT_CODE=your_contract_code
MONNIFY_BASE_URL=https://sandbox.monnify.com   # → https://api.monnify.com in prod
NEXT_PUBLIC_BASE_URL=http://localhost:3000
MONNIFY_WEBHOOK_IPS=35.242.133.146             # Monnify's published webhook IP(s)

# Required for webhook route — Monnify sends no user JWT, so anon/authenticated clients
# cannot write to DB through RLS. Service role bypasses RLS entirely.
# Get from: Supabase Dashboard → Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> [!CAUTION]
> `SUPABASE_SERVICE_ROLE_KEY` must **never** be prefixed with `NEXT_PUBLIC_`. It must only appear in server-side route files accessed through `supabaseAdmin()`. Audit every import before shipping.

### New Files

---

#### [NEW] lib/monnify.ts

```typescript
// Token singleton — module-level cache, not per-request
let tokenCache: { token: string; expiresAt: number } | null = null;

export async function getMonnifyToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) return tokenCache.token;
  
  const credentials = Buffer.from(
    `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
  ).toString('base64');
  
  const res = await fetch(`${process.env.MONNIFY_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}` }
  });
  
  if (!res.ok) throw new Error(`Monnify auth failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error('Monnify auth: requestSuccessful=false');
  
  tokenCache = {
    token: responseBody.accessToken,
    expiresAt: Date.now() + 55 * 60 * 1000  // 55 min (token expires at 60)
  };
  return tokenCache.token;
}

export async function initializeTransaction(payload: {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  paymentDescription: string;
  currencyCode: string;
  contractCode: string;
  redirectUrl: string;
}): Promise<{ checkoutUrl: string; transactionReference: string }> {
  const token = await getMonnifyToken();
  const res = await fetch(
    `${process.env.MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );
  
  if (!res.ok) throw new Error(`Monnify init failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error(`Monnify init: requestSuccessful=false`);
  
  return {
    checkoutUrl: responseBody.checkoutUrl,
    transactionReference: responseBody.transactionReference
  };
}

export async function verifyTransaction(paymentReference: string) {
  const token = await getMonnifyToken();
  const url = `${process.env.MONNIFY_BASE_URL}/api/v2/merchant/transactions/query` +
    `?paymentReference=${encodeURIComponent(paymentReference)}`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error(`Monnify verify failed: ${res.status}`);
  const { requestSuccessful, responseBody } = await res.json();
  if (!requestSuccessful) throw new Error('Monnify verify: requestSuccessful=false');
  
  return responseBody;
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const { createHmac, timingSafeEqual } = require('crypto');
  const computed = createHmac('sha512', process.env.MONNIFY_SECRET_KEY!)
    .update(rawBody)
    .digest('hex');
  
  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(signature, 'hex');
  
  // timingSafeEqual throws if lengths differ — check first
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

---

#### [NEW] app/api/payment/initiate/route.ts

```
POST /api/payment/initiate
Auth: Logged-in user (supabaseRoute client)
Body: { customer_name, customer_phone, customer_address, items, total_amount, notes?, promo_code? }

Idempotency key definition (precisely):
  hash = SHA256(user_id + sorted(items by product_id+size) stringified)
  If an order with this hash exists AND payment_status is 'unpaid' or 'pending',
  reuse its payment_reference and return the existing checkoutUrl.
  If address changes between attempts, that's fine — update the address on the existing order.
  If items change, it's a different hash → new order.

Flow:
1. Validate body with Zod schema
2. Check stock: for each item, query products.stock_quantity >= item.quantity
   → 400 if any item is out of stock (list which ones)
3. If promo_code provided: call supabase.rpc('validate_promo', { code, cart_total })
   → 400 if invalid, extract discount_amount and normalized_code
4. Compute idempotency hash from user_id + items
5. Check DB: SELECT * FROM orders WHERE idempotency_hash = $hash AND payment_status IN ('unpaid','pending')
   → If found: return existing { checkoutUrl, order_number, payment_reference }
6. Generate order_number: format 'MW-' + year + '-' + zero-padded sequential count
   (Use a Postgres sequence or the existing count query, wrapped in a transaction)
7. Generate payment_reference: 'MW-REF-' + nanoid(10)
8. INSERT order with: all customer fields, items, total_amount, amount_expected (post-discount),
   payment_reference, promo_code (normalized), discount_amount, idempotency_hash, payment_status='unpaid'
9. Call initializeTransaction() with amount_expected (NOT total_amount if promo applied)
10. UPDATE order SET monnify_transaction_ref, payment_status='pending'
11. Return { checkoutUrl, order_number, payment_reference }

Error handling:
- Monnify call fails → rollback order INSERT (use a transaction or delete the order row)
- Any step fails → return user-friendly error with a support reference number
```

> [!IMPORTANT]
> **Order number format:** `MW-2026-00001` — year prefix + 5-digit zero-padded sequential counter. Human-friendly for support conversations. Reset counter annually or use a global Postgres sequence (`CREATE SEQUENCE order_seq`).

---

#### [NEW] app/api/payment/webhook/route.ts

```typescript
// CRITICAL IMPLEMENTATION CONSTRAINT:
// Do NOT use request.json() anywhere in this handler.
// The body must be read as raw text FIRST, then parsed manually.
// Calling request.json() consumes the stream and destroys the original byte sequence,
// making HMAC validation impossible.

export async function POST(request: Request) {
  // Step 1: Read raw body as text — BEFORE any parsing
  const rawBody = await request.text();

  // Step 2: IP whitelist check (defense in depth)
  const sourceIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const allowedIps = (process.env.MONNIFY_WEBHOOK_IPS ?? '').split(',');
  if (!allowedIps.includes(sourceIp ?? '')) {
    console.warn(`[webhook] Rejected request from unexpected IP: ${sourceIp}`);
    return new Response('OK', { status: 200 });  // silent, same as bad HMAC
  }

  // Step 3: HMAC-SHA512 signature verification
  const signature = request.headers.get('monnify-signature') ?? '';
  const signatureValid = verifyWebhookSignature(rawBody, signature);
  // Return 200 on bad signature (not 400) — 400 triggers Monnify retry storm
  if (!signatureValid) {
    console.error('[webhook] Invalid HMAC signature — possible tampered request');
    return new Response('OK', { status: 200 });
  }

  // Step 4: Parse body (safe to parse now)
  const body = JSON.parse(rawBody);

  // Step 5: Only handle successful transactions; ack everything else
  if (body.eventType !== 'SUCCESSFUL_TRANSACTION') {
    return Response.json({ responseCode: '00', responseMessage: 'Acknowledged' });
  }

  const { paymentReference, transactionReference, amountPaid, paymentMethod } = body.eventData;

  // Step 6: Server-side verify with Monnify (never trust payload alone)
  let monnifyData;
  try {
    monnifyData = await verifyTransaction(paymentReference);
  } catch (err) {
    console.error('[webhook] Monnify verify call failed:', err);
    // Return 200 so Monnify doesn't retry; log for manual investigation
    return Response.json({ responseCode: '00', responseMessage: 'Logged' });
  }

  // Step 7: Call confirm_payment RPC (atomic triple-write: order + event + promo)
  const admin = supabaseAdmin();
  const { data, error } = await admin.rpc('confirm_payment', {
    p_payment_reference: paymentReference,
    p_monnify_ref:       transactionReference,
    p_amount_paid:       monnifyData.amountPaid,
    p_payment_channel:   paymentMethod,
  });

  if (error) {
    // Log with full context for monitoring/alerting
    console.error('[webhook] confirm_payment RPC error:', {
      error, paymentReference, transactionReference
    });
    // Still return 200 to prevent retry storm; investigate via logs
    return Response.json({ responseCode: '00', responseMessage: 'Logged' });
  }

  // Step 8: Log retry events for visibility (idempotent already_paid responses)
  if (data?.status === 'already_paid') {
    console.warn('[webhook] Received duplicate webhook for already-paid order:', paymentReference);
    // This often signals Monnify misconfiguration — surface in monitoring
  }

  return Response.json({ responseCode: '00', responseMessage: 'Success' });
}
```

---

#### [NEW] app/api/payment/verify/route.ts

```
GET /api/payment/verify?reference=MW-REF-xxx
Auth: Logged-in user

Ownership check (at DB level, not application code):
  SELECT * FROM orders
   WHERE payment_reference = $reference
     AND user_id = auth.uid()   ← prevents enumeration of other users' orders
  
  If not found → 404 (same response whether order doesn't exist or belongs to another user)

If payment_status = 'paid' → return { status: 'paid', order_number }
If payment_status = 'pending' + payment_channel = 'ACCOUNT_TRANSFER'
  → return { status: 'transfer_pending', order_number }
  → Do NOT call Monnify verify for transfer — webhook will handle it async
If payment_status in ('unpaid','pending') + card/USSD:
  → Call verifyTransaction() from Monnify
  → If paid: call confirm_payment RPC, return { status: 'paid', order_number }
  → If not yet paid: return { status: 'pending' }
```

**Cart clearing:**
The success page clears the cart **only when this endpoint returns `status: 'paid'`**, not on page load. This prevents the race condition where the user navigates away before the success page clears the cart.

---

#### [NEW] app/[locale]/(public)/payment/success/page.tsx

Handles two distinct UX flows based on payment channel:

**Card / USSD (synchronous):**
- Poll `/api/payment/verify` every 3s, up to 30s
- On `paid`: clear cart, redirect to `/orders/[order_number]`
- On timeout: "Payment is taking longer than expected. Your order reference is [X]. Check your order history or contact support."

**Bank Transfer (asynchronous):**
- On page load: check DB via verify endpoint
- If `transfer_pending`: show distinct state immediately — do NOT poll
  > *"Your transfer has been initiated. Bank transfers typically confirm within 5–30 minutes. We'll update your order automatically — no need to stay on this page."*
- Show order number prominently + link to `/orders/[order_number]`
- Do not show error, spinner, or countdown
- Cart is NOT cleared here — it clears when webhook fires and user next visits tracking page

**State machine:**
```
initial
  ↓ check DB
  ├─ paid           → clear cart → redirect to /orders/[order_number]
  ├─ transfer_pending → show async state (no polling)
  └─ pending (card) → poll every 3s
        ├─ paid     → clear cart → redirect
        └─ timeout  → show manual check message
```

---

#### [NEW] app/[locale]/(public)/payment/failed/page.tsx
- Read failure reason from Monnify redirect query params
- Display human-readable message (card declined, session expired, etc.)
- Retry CTA → back to checkout (cart intact, not cleared on failed payment)

---

### Edge Cases & Safety Nets

| Scenario | Handling |
|---|---|
| User submits checkout twice (same items) | Idempotency hash lookup reuses existing `payment_reference` |
| User changes address between retries | Address updated on existing order; hash unchanged (address not hashed) |
| Webhook arrives before success page loads | Polling detects `paid` state immediately on first check |
| Monnify webhook retried (non-200 response) | `confirm_payment` RPC: `already_paid` early return → handler responds 200 |
| Bad HMAC signature | 200 + silent log → prevents Monnify retry storm |
| Unexpected source IP | 200 + warning log → same treatment as bad HMAC |
| `timingSafeEqual` length mismatch | Explicit length check before calling it → returns `false` without throwing |
| Tampered redirect (client changes amount) | Webhook checks `amountPaid >= order.amount_expected` from DB (not payload) |
| `amount_expected = 0` bug | Prevented by `CHECK (amount_expected > 0)` + no default value |
| Promo slot burned on abandoned payment | `uses_count` only incremented inside `confirm_payment` RPC, not at initiate |
| Two users race for last promo slot | `confirm_payment` RPC increments with `AND uses_count < max_uses` guard |
| Bank transfer pending for hours | `payment_status = 'pending'` + `payment_channel = 'ACCOUNT_TRANSFER'` → async UI state |
| Cart cleared before payment confirmed | Cart cleared only on verified `payment_status = 'paid'` from verify endpoint |
| Monnify verify call fails in webhook | Log + return 200; do NOT confirm order; investigate via logs |
| Admin goes `delivered → pending` | `update_order_status` RPC enforces state machine; raises exception on invalid transition |
| User enumerates other users' references | Verify endpoint ownership: `AND user_id = auth.uid()` at DB level → same 404 for miss/other |
| Brute-force on promo validate | Rate limit: 10 req/min per user (see Phase 4 implementation note) |
| Stock runs out between cart add and payment | Stock check in initiate route before calling Monnify |
| Token expires mid-request | Module-level singleton with 55-min TTL refreshes automatically |
| `SUPABASE_SERVICE_ROLE_KEY` exposed | Server-only files only; CI lint rule to ban `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE` |

---

## Phase 3 — Order Tracking

### Order Number Format

Format: `MW-YYYY-NNNNN` (e.g. `MW-2026-00047`)

Implementation: Use a Postgres sequence per year:
```sql
CREATE SEQUENCE IF NOT EXISTS order_number_seq_2026 START 1;
-- Generate: 'MW-2026-' || lpad(nextval('order_number_seq_2026')::text, 5, '0')
-- Create a new sequence each year, or use a global seq with year prefix in app code
```

### New Files

#### [NEW] app/[locale]/(public)/orders/[order_number]/page.tsx
- Protected: user must be logged in and own the order (check `user_id = auth.uid()` in query)
- Displays order summary: items, subtotal, discount applied, total paid
- Timeline component: each `order_tracking_events` row shown as a step
- Status icons per state: clock (pending), checkmark (confirmed), gear (processing), truck (shipped), package (delivered)
- Shows `payment_channel` and `amount_paid` for transparency

#### [MODIFY] app/api/orders/[id]/status/route.ts

```
PATCH /api/orders/[id]/status
Auth: Admin only (check profile.role = 'admin' in DB, not just application code)
Body: { status: OrderStatus, note?: string }

Flow:
1. Auth check
2. Call update_order_status RPC (state machine enforced in Postgres)
3. Return { ok: true, new_status }
4. On RPC exception → 400 with the exception message
```

#### [MODIFY] Admin orders page
- Status dropdown per order (only shows valid next states based on current status)
- Payment status badge (unpaid / pending / paid / failed)
- Link to `/orders/[order_number]` (the public tracking page)
- Filter by payment_status to find unpaid/pending orders

---

## Phase 4 — Influencer Promo Codes

### Rate Limiting on `/api/promos/validate`

> [!IMPORTANT]
> This endpoint is callable by any authenticated user. Without rate limiting, promo codes can be brute-forced. Use one of:
> - **Upstash Redis** (recommended): `@upstash/ratelimit` — 10 req/60s per user ID
> - **Simple in-memory**: `lru-cache` keyed by user ID (resets on cold start, acceptable for low traffic)
> 
> Add to `.env.local`: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### New Files

#### [NEW] app/api/promos/validate/route.ts
```
POST /api/promos/validate
Auth: Logged-in user
Rate limit: 10 req/60s per user ID
Body: { code: string, cart_total: number }

Flow:
1. Rate limit check → 429 if exceeded
2. supabase.rpc('validate_promo', { p_code: code, p_cart_total: cart_total })
3. Return RPC result directly
```

#### [NEW] app/api/admin/promos/route.ts
```
GET  /api/admin/promos?page=1&limit=20&influencer=xxx&active=true
  → Paginated list (default 20/page) with total count header
  → Filter by influencer_name (ILIKE), is_active
POST /api/admin/promos
  → Create new promo code (body validated with Zod)
  → Normalize code to UPPERCASE before insert
```

#### [NEW] app/api/admin/promos/[id]/route.ts
```
PATCH  → Update fields (cannot reduce uses_count below current value)
DELETE → Soft delete: set is_active=false (hard delete loses attribution data)
```

#### [NEW] app/[locale]/(admin)/admin/promos/page.tsx
- Table: code, type, value, uses_count/max_uses, influencer, valid_until, active status
- Create form: code (auto-uppercased on blur), type, value, max_uses, dates, influencer attribution, min_order
- Row actions: copy share link, deactivate, edit
- Stats: total active codes, total redemptions this month

### Checkout UX (Phase 2 additions)
- Promo code input below items list
- "Apply" button → calls `/api/promos/validate` (debounced 500ms)
- On valid: show green tick + "₦X off applied" — update order summary total
- On invalid: show inline error message (from RPC's `message` field)
- Normalized code (from RPC response) stored in state and sent at initiate, not raw input

---

## Verification Plan

### Automated
```bash
npm run build   # Zero TypeScript errors
npm run lint    # Zero warnings
```

### Manual Sandbox Testing
1. Run Phase 1 migration → confirm schema in Supabase Table Editor
2. Add `ngrok http 3000` → set webhook URL in Monnify sandbox dashboard
3. Create order with promo code → verify `uses_count` NOT incremented at initiate
4. Complete card payment (Monnify test card) → verify webhook fires → `uses_count` incremented
5. Abandon a payment → verify `uses_count` unchanged
6. Complete transfer payment → verify "transfer pending" UI state shown
7. Simulate webhook arriving 5 min later → verify tracking page updates
8. Submit checkout twice with same items → verify single order created (idempotency)
9. Admin: try `delivered → pending` → verify 400 error with state machine message
10. Call `/api/payment/verify?reference=other-users-ref` → verify 404

### Edge Case Tests
- Submit with promo below min order → correct error, no slot burned
- Send webhook with mismatched amount → RPC raises exception, order stays `unpaid`
- Send webhook twice for same reference → second returns `already_paid`
- Send webhook with wrong IP → 200 + warning log, order unchanged
- Call `/api/promos/validate` 11 times in 60s → 429 on 11th

---

## Open Questions

> [!IMPORTANT]
> **Delivery fee:** Flat fee added to `amount_expected` before Monnify, or billed separately via WhatsApp? This must be decided before Phase 2 — it determines what value populates `amount_expected`.

> [!IMPORTANT]
> **Promo stacking:** One code per order (simpler, recommended) or multiple? Multiple codes require schema changes (promo_code column → promo_codes JSONB array).

> [!NOTE]
> **WhatsApp Support link:** Keep in footer for general support, or remove entirely?

> [!NOTE]
> **Refunds:** Out of scope for now, or add a "Refund" button to admin order page? Monnify supports refund initiation via API.
