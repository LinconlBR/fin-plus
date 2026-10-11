-- Item 9 (higiene das funções) e item 4 (limite de uso da IA) da auditoria.
-- Rodar no SQL Editor do Supabase ANTES de publicar o código desta branch;
-- sem a função consume_ai_quota as actions de IA devolvem vazio (falha fechada).
-- Testada num Postgres local descartável (ver descrição do PR).

-- ===== Item 9: higiene das funções SECURITY DEFINER =====
alter function public.handle_new_user() set search_path = '';
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.snapshot_budget_history() from public, anon, authenticated;

-- ===== Item 4: limite de uso da IA por usuário (janela de 1 hora) =====
create table public.ai_usage (
  user_id uuid not null references public.profiles(id) on delete cascade,
  window_start timestamptz not null,
  calls integer not null default 0 check (calls >= 0),
  primary key (user_id, window_start)
);
alter table public.ai_usage enable row level security;

create policy "Usuários veem o próprio uso de IA" on public.ai_usage
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Usuários registram o próprio uso de IA" on public.ai_usage
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Usuários atualizam o próprio uso de IA" on public.ai_usage
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.consume_ai_quota(max_calls integer default 30)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  used integer;
begin
  if (select auth.uid()) is null then
    return false;
  end if;

  -- limpeza barata: some só com linhas antigas do próprio usuário
  delete from public.ai_usage
  where user_id = (select auth.uid()) and window_start < now() - interval '1 day';

  -- atômico: o UPDATE só acontece se ainda houver cota; sem cota não retorna linha
  insert into public.ai_usage as u (user_id, window_start, calls)
  values ((select auth.uid()), date_trunc('hour', now()), 1)
  on conflict (user_id, window_start)
  do update set calls = u.calls + 1 where u.calls < max_calls
  returning u.calls into used;

  return used is not null;
end;
$$;

revoke execute on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;
