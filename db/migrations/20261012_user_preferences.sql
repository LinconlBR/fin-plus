-- ============================================================================
-- Fin+ — Preferências do usuário (layout do Dashboard)
-- ============================================================================
-- Rodar no SQL Editor do Supabase. Idempotente: pode rodar mais de uma vez.
--
-- Uma linha por usuário (1:1 com profiles). dashboard_layout guarda a ordem e a
-- visibilidade dos blocos do Dashboard, como uma lista JSON:
--   [{"id": "cards", "visible": true}, {"id": "chart", "visible": false}, ...]
-- O app valida e completa essa lista (lib/dashboard-layout.ts), então linhas
-- antigas continuam funcionando se um bloco novo for criado depois.
-- ============================================================================

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on update cascade on delete cascade,
  dashboard_layout jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  -- Impede gravar algo que não seja uma lista (e limita o tamanho).
  constraint dashboard_layout_is_array check (
    jsonb_typeof(dashboard_layout) = 'array' and jsonb_array_length(dashboard_layout) <= 20
  )
);

alter table public.user_preferences enable row level security;

drop policy if exists "Usuários veem as próprias preferências" on public.user_preferences;
create policy "Usuários veem as próprias preferências"
  on public.user_preferences for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Usuários criam as próprias preferências" on public.user_preferences;
create policy "Usuários criam as próprias preferências"
  on public.user_preferences for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam as próprias preferências" on public.user_preferences;
create policy "Usuários atualizam as próprias preferências"
  on public.user_preferences for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
