-- Merit Luxury Wears Limited — Supabase schema (run in SQL Editor)
-- Make sure to enable Storage and create a public bucket named "product-images".

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Helper: bypass RLS to check if the current user is an admin.
-- Using SECURITY DEFINER prevents the recursive policy lookup that
-- would otherwise occur when a profiles policy needs to read profiles.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (
    auth.uid() = id or public.is_admin()
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin());

-- 2. Trigger to insert profile row on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text not null check (category in ('native','casual','corporate','shoes','watches','accessories')),
  image_urls text[] not null default '{}',
  sizes text[] not null default '{}',
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "products_public_select" on public.products;
create policy "products_public_select" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all using (public.is_admin())
  with check (public.is_admin());

-- 4. Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  user_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  items jsonb not null,
  total_amount numeric(10,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  whatsapp_sent boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "orders_insert_self" on public.orders;
create policy "orders_insert_self" on public.orders
  for insert with check (auth.uid() = user_id);

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders
  for update using (public.is_admin());

-- 5. Storage bucket (run in dashboard or):
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
--   on conflict (id) do nothing;
