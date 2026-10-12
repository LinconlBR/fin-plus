-- ============================================================================
-- Fin+ — Regras de categoria aprendidas na importação de extratos
-- ============================================================================
-- Rodar no SQL Editor do Supabase. Idempotente: pode rodar mais de uma vez.
--
-- Quando a pessoa corrige a categoria de uma transação importada, guardamos
-- "estabelecimento + tipo → categoria". Na próxima importação, o mesmo
-- estabelecimento já vem categorizado. merchant_key é calculado pelo app
-- (lib/merchant.ts), ex.: "mercadona san", "bizum eusebio".
-- ============================================================================

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  merchant_key text not null check (char_length(merchant_key) between 1 and 60),
  type text not null check (type in ('income', 'expense')),
  -- Apagar a categoria apaga as regras que apontavam para ela.
  category_id uuid not null references public.categories(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Uma regra por estabelecimento e tipo: permite o upsert do app.
  constraint category_rules_unique unique (user_id, merchant_key, type)
);

-- Chave estrangeira sem índice deixa o ON DELETE CASCADE lento.
create index if not exists category_rules_category_id_idx on public.category_rules (category_id);

alter table public.category_rules enable row level security;

drop policy if exists "Usuários gerenciam as próprias regras de categoria" on public.category_rules;
create policy "Usuários gerenciam as próprias regras de categoria"
  on public.category_rules for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
