-- Super Likes: one free every 24 hours, plus any bought in the app.
-- Only the backend (service role) can touch these; the app never reads them
-- directly. Safe to run more than once.

-- How many bought Super Likes each person has left, and when they last used
-- their free one
create table if not exists public.super_like_balances (
  user_id uuid primary key references auth.users(id) on delete cascade,
  purchased integer not null default 0 check (purchased >= 0),
  free_used_at timestamptz,
  updated_at timestamptz not null default now()
);

-- Every purchase Apple confirmed (through RevenueCat). The transaction id is
-- unique, so the same purchase can never be counted twice.
create table if not exists public.super_like_purchases (
  transaction_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  quantity integer not null check (quantity > 0),
  store text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists super_like_purchases_user on public.super_like_purchases (user_id);

alter table public.super_like_balances enable row level security;
alter table public.super_like_purchases enable row level security;
revoke all on public.super_like_balances, public.super_like_purchases from anon, authenticated;
grant select, insert, update, delete on public.super_like_balances, public.super_like_purchases to service_role;

-- Use one Super Like: the free one if it's available, otherwise a bought one.
-- Returns 'free', 'purchased', or null when there are none left. Locks the
-- row, so two taps at once can't spend the same Super Like twice.
create or replace function public.use_super_like(p_user uuid)
returns text language plpgsql as $$
declare
  b public.super_like_balances;
begin
  insert into public.super_like_balances (user_id) values (p_user) on conflict (user_id) do nothing;
  select * into b from public.super_like_balances where user_id = p_user for update;

  if b.free_used_at is null or b.free_used_at <= now() - interval '24 hours' then
    update public.super_like_balances set free_used_at = now(), updated_at = now() where user_id = p_user;
    return 'free';
  end if;

  if b.purchased > 0 then
    update public.super_like_balances set purchased = purchased - 1, updated_at = now() where user_id = p_user;
    return 'purchased';
  end if;

  return null;
end $$;

-- Give back a Super Like that was taken but not used (the swipe failed)
create or replace function public.refund_super_like(p_user uuid, p_kind text)
returns void language plpgsql as $$
begin
  if p_kind = 'free' then
    update public.super_like_balances set free_used_at = null, updated_at = now() where user_id = p_user;
  elsif p_kind = 'purchased' then
    update public.super_like_balances set purchased = purchased + 1, updated_at = now() where user_id = p_user;
  end if;
end $$;

-- Add a purchase once. Returns true if it was new, false if already counted.
create or replace function public.add_super_like_purchase(
  p_transaction text, p_user uuid, p_product text, p_quantity integer, p_store text
) returns boolean language plpgsql as $$
begin
  insert into public.super_like_purchases (transaction_id, user_id, product_id, quantity, store)
  values (p_transaction, p_user, p_product, p_quantity, p_store)
  on conflict (transaction_id) do nothing;
  if not found then return false; end if;

  insert into public.super_like_balances (user_id, purchased) values (p_user, p_quantity)
  on conflict (user_id) do update
    set purchased = public.super_like_balances.purchased + excluded.purchased, updated_at = now();
  return true;
end $$;

-- Apple refunded a purchase: take back what's left of it (never below zero).
-- Returns true if it was found and not already refunded.
create or replace function public.refund_super_like_purchase(p_transaction text)
returns boolean language plpgsql as $$
declare
  p public.super_like_purchases;
begin
  update public.super_like_purchases set refunded_at = now()
  where transaction_id = p_transaction and refunded_at is null
  returning * into p;
  if p is null then return false; end if;

  update public.super_like_balances
  set purchased = greatest(purchased - p.quantity, 0), updated_at = now()
  where user_id = p.user_id;
  return true;
end $$;

-- Only the backend may call these
revoke all on function public.use_super_like(uuid) from public, anon, authenticated;
revoke all on function public.refund_super_like(uuid, text) from public, anon, authenticated;
revoke all on function public.add_super_like_purchase(text, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.refund_super_like_purchase(text) from public, anon, authenticated;
grant execute on function public.use_super_like(uuid) to service_role;
grant execute on function public.refund_super_like(uuid, text) to service_role;
grant execute on function public.add_super_like_purchase(text, uuid, text, integer, text) to service_role;
grant execute on function public.refund_super_like_purchase(text) to service_role;
