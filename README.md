# Merit Luxury Wears Limited

Luxury fashion e-commerce — Navy & Silver editorial identity. Next.js 14 (App Router) + Supabase + Zustand. WhatsApp click-to-order checkout.

## Stack

- Next.js 14 + TypeScript (App Router, Server Components by default)
- Supabase (Auth, Postgres, Storage, RLS)
- Tailwind CSS — Midnight Sterling design tokens (Bodoni Moda + DM Sans, navy `#001F3F`, silver borders, sharp 0px corners)
- Zustand (cart, persisted to localStorage)

## Getting started

```powershell
# 1. Install
npm install

# 2. Configure env
copy .env.local.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_WHATSAPP_NUMBER

# 3. Provision Supabase
# - Open the Supabase SQL Editor and paste supabase/schema.sql
# - Storage > New bucket: name "product-images", set public

# 4. Make yourself an admin (after signing up at /register)
# In SQL Editor:
#   update profiles set role = 'admin' where email = 'you@example.com';

# 5. Run
npm run dev
```

Open http://localhost:3000.

## Folder structure

```
app/
  (public)/    # storefront: home, shop, product, cart, checkout
  (auth)/      # login, register
  (account)/   # account/order history
  (admin)/     # admin dashboard, products, orders, customers
  api/         # products, orders, customers, admin/upload
components/
  layout/      # Navbar, Footer, AdminSidebar
  products/    # ProductCard, ProductGrid, ProductForm
hooks/         # useCart (zustand+persist), useAuth
lib/           # supabase client, supabaseServer, whatsapp helper, currency
types/         # shared TS types
middleware.ts  # /admin route protection
supabase/schema.sql
```

## Key flows

- **Checkout**: form → POST `/api/orders` (saves to Supabase, generates `MW-YYYY-####`) → opens pre-filled WhatsApp link → clears cart → redirects to `/account`.
- **Admin protection**: `middleware.ts` checks Supabase session + `profiles.role = 'admin'` for any `/admin/*` request.
- **Image upload**: admin form posts to `/api/admin/upload` → Supabase Storage `product-images` bucket → returns public URL stored in `products.image_urls[]`.

## Notes

- The design follows the Midnight Sterling tokens in `stitch_minimalist_corporate_portfolio/midnight_sterling/DESIGN.md` — adapted to PRD copy, navigation and flows. Layouts may differ from screens where required to fit functionality.
- WhatsApp number is read from `NEXT_PUBLIC_WHATSAPP_NUMBER` (international format, no `+`).
- No payment gateway is wired in — WhatsApp is the only checkout per PRD §1.2.
