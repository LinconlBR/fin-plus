-- ============================================================================
-- Fin+ — Exclusão da própria conta
-- ============================================================================
-- Rodar no SQL Editor do Supabase. Idempotente.
--
-- Apaga o usuário logado de auth.users. Todas as tabelas do app descendem de
-- profiles/auth.users com ON DELETE CASCADE, então transações, metas, orçamentos,
-- categorias e preferências somem junto. SECURITY DEFINER é necessário porque
-- o papel "authenticated" não pode escrever em auth.users; a função só mexe no
-- id de auth.uid(), então ninguém apaga a conta de outra pessoa.
-- ============================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
