-- ============================================================================
-- Fin+ — Desempenho do banco e alinhamento do schema (itens 8 e 19 da auditoria)
-- ============================================================================
-- Rodar no SQL Editor do Supabase. Idempotente: pode rodar mais de uma vez.
--
-- 1) Policies: auth.uid() -> (select auth.uid()). Sem o select, o Postgres
--    reavalia a função para CADA linha; com ele, avalia uma vez por consulta.
--    Os nomes das policies não mudam. A de transactions ganha WITH CHECK
--    explícito (antes valia por herança do USING).
-- 2) Índices nas chaves estrangeiras que não tinham, já com a coluna de data
--    em transactions, que é como o app consulta.
-- 3) Remove goals.current_amount: o app nunca lê nem grava esta coluna (o
--    progresso é a soma de goal_contributions) e as 3 metas têm valor 0.
-- ============================================================================

begin;

-- 1) Policies ---------------------------------------------------------------
drop policy if exists "Usuários veem o próprio perfil" on public.profiles;
create policy "Usuários veem o próprio perfil"
  on public.profiles for select
  using ((select auth.uid()) = id);

drop policy if exists "Usuários atualizam o próprio perfil" on public.profiles;
create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "Usuários gerenciam as próprias categorias" on public.categories;
create policy "Usuários gerenciam as próprias categorias"
  on public.categories for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários gerenciam as próprias transações" on public.transactions;
create policy "Usuários gerenciam as próprias transações"
  on public.transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários gerenciam os próprios orçamentos" on public.budgets;
create policy "Usuários gerenciam os próprios orçamentos"
  on public.budgets for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários gerenciam as próprias metas" on public.goals;
create policy "Usuários gerenciam as próprias metas"
  on public.goals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários gerenciam as próprias contribuições" on public.goal_contributions;
create policy "Usuários gerenciam as próprias contribuições"
  on public.goal_contributions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários veem o histórico dos próprios orçamentos" on public.budget_history;
create policy "Usuários veem o histórico dos próprios orçamentos"
  on public.budget_history for select
  using (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id
        and budgets.user_id = (select auth.uid())
    )
  );

drop policy if exists "Usuários criam histórico dos próprios orçamentos" on public.budget_history;
create policy "Usuários criam histórico dos próprios orçamentos"
  on public.budget_history for insert
  with check (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id
        and budgets.user_id = (select auth.uid())
    )
  );

drop policy if exists "Usuários atualizam histórico dos próprios orçamentos" on public.budget_history;
create policy "Usuários atualizam histórico dos próprios orçamentos"
  on public.budget_history for update
  using (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id
        and budgets.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id
        and budgets.user_id = (select auth.uid())
    )
  );

-- 2) Índices ----------------------------------------------------------------
-- transactions.user_id fica coberto pelo índice composto (user_id, date).
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);
create index if not exists transactions_category_id_idx
  on public.transactions (category_id);
create index if not exists budgets_user_id_idx
  on public.budgets (user_id);
create index if not exists budgets_category_id_idx
  on public.budgets (category_id);
create index if not exists goals_user_id_idx
  on public.goals (user_id);
create index if not exists goal_contributions_goal_id_idx
  on public.goal_contributions (goal_id);
create index if not exists goal_contributions_user_id_idx
  on public.goal_contributions (user_id);
-- categories.user_id e budget_history.budget_id já são cobertos pelos índices
-- únicos existentes (ambos começam por essa coluna).

-- 3) Coluna legada ----------------------------------------------------------
alter table public.goals drop column if exists current_amount;

commit;
