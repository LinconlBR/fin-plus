-- ============================================================================
-- Fin+ — Schema completo do banco de dados (Supabase / PostgreSQL)
-- ============================================================================
-- Roda esse arquivo inteiro no SQL Editor de um projeto Supabase novo pra
-- recriar toda a estrutura de dados do zero: extensões, domains, tabelas,
-- constraints, Row Level Security e o trigger de cadastro.
--
-- Ordem importa: domains antes das tabelas que os usam; tabelas na ordem de
-- dependência de foreign key (profiles → categories → transactions/budgets →
-- budget_history; profiles → goals → goal_contributions).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extensões
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- necessária para gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Domains — tipos customizados para padronizar valores monetários
-- ----------------------------------------------------------------------------
-- numeric(12,2): até 12 dígitos no total, 2 casas decimais — evita valores
-- monetários com precisão maluca (ex: R$ 10,999).

create domain positive_money_amount as numeric(12,2)
  check (value > 0);
-- Uso: valores-alvo (orçamentos, metas) — não faz sentido um limite/objetivo de R$ 0.

-- ----------------------------------------------------------------------------
-- Tabela: profiles
-- ----------------------------------------------------------------------------
-- Espelha auth.users (1:1) — id não é gerado aqui, vem do próprio usuário do
-- Supabase Auth.

create table public.profiles (
  id uuid primary key references auth.users(id) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  full_name text,
  currency text not null default 'BRL'
);

alter table public.profiles enable row level security;

create policy "Usuários veem o próprio perfil"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ----------------------------------------------------------------------------
-- Tabela: categories
-- ----------------------------------------------------------------------------
-- icon/color: nome do ícone (lucide-react) e hex da cor, usados na UI.
-- Populadas automaticamente no cadastro pelo trigger handle_new_user.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text,
  color text
);

alter table public.categories enable row level security;

create policy "Usuários gerenciam as próprias categorias"
  on public.categories for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Tabela: transactions
-- ----------------------------------------------------------------------------
-- category_id usa ON DELETE SET NULL: apagar uma categoria não apaga o
-- histórico financeiro, só desvincula a transação dela.
--
-- ⚠️ Furo de dado conhecido (ainda não corrigido): transações e orçamentos
-- órfãos (category_id = null) "batem" entre si em qualquer comparação de
-- category_id, já que null = null é falso no SQL padrão mas o código da
-- aplicação hoje compara isso do lado do cliente, onde null === null é
-- verdadeiro em JavaScript. Resolver antes de permitir apagar categorias
-- pela UI.
--
-- type fica salvo na própria transação (não só derivado da categoria) —
-- é um fato histórico permanente, que não pode virar ambíguo se a categoria
-- for apagada depois.

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  description text,
  date date not null
);

alter table public.transactions enable row level security;

create policy "Usuários gerenciam as próprias transações"
  on public.transactions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Tabela: budgets
-- ----------------------------------------------------------------------------
-- Limite de gasto por categoria. is_recurring decide como o "período atual"
-- é calculado:
--   true  → recalculado dinamicamente a cada semana/mês, a partir de hoje
--           (start_date = desde quando o orçamento existe; end_date fica
--           vazio = "ativo indefinidamente")
--   false → intervalo fixo único, usa start_date/end_date literalmente

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  category_id uuid references public.categories(id) on update cascade on delete set null,
  target_amount positive_money_amount not null,
  period text not null check (period in ('weekly', 'monthly')),
  start_date date not null,
  end_date date,
  is_recurring boolean not null default true
);

alter table public.budgets enable row level security;

create policy "Usuários gerenciam os próprios orçamentos"
  on public.budgets for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Tabela: goals
-- ----------------------------------------------------------------------------
-- Metas de economia de longo prazo — conceito diferente de orçamento
-- (sem período recorrente; um valor-alvo, um valor já acumulado, um prazo
-- opcional).

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references public.profiles(id) on update cascade on delete cascade,
  name text not null,
  target_amount positive_money_amount not null,
  -- O progresso da meta NÃO é uma coluna: vem da soma de goal_contributions.
  deadline date
);

alter table public.goals enable row level security;

create policy "Usuários gerenciam as próprias metas"
  on public.goals for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Tabela: goal_contributions
-- ----------------------------------------------------------------------------
-- Cada aporte feito numa meta. O progresso da meta é SEMPRE a soma destas
-- linhas, nunca um valor editado direto: assim o histórico de quando cada valor
-- foi guardado se preserva (usado em Relatórios → Evolução das metas).

create table public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount positive_money_amount not null,
  date date not null default current_date
);

alter table public.goal_contributions enable row level security;

create policy "Usuários gerenciam as próprias contribuições"
  on public.goal_contributions for all
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Tabela: budget_history
-- ----------------------------------------------------------------------------
-- Um "snapshot" do limite de cada orçamento por mês, gravado por
-- createBudget/updateBudget (upsert). Permite navegar até meses passados e
-- comparar o gasto com o limite que valia NAQUELE mês. Orçamento sem nenhuma
-- linha até o mês visto simplesmente não aparece: não se aproxima com o valor
-- de hoje.
--
-- period é texto "YYYY-MM": ordena e compara como string, sem Date nem fuso.
-- Não tem user_id: a RLS descobre o dono pelo orçamento (budgets.user_id).
-- Apagar o orçamento apaga o histórico dele (on delete cascade).
--
-- Orçamentos criados ANTES desta tabela existir não têm linha nenhuma e somem
-- de qualquer mês. Num banco já em uso, faça o backfill uma vez:
--   insert into budget_history (budget_id, period, amount)
--   select b.id, to_char(b.start_date, 'YYYY-MM'), b.target_amount
--   from budgets b
--   where not exists (select 1 from budget_history h where h.budget_id = b.id);

create table public.budget_history (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references public.budgets(id) on delete cascade,
  period text not null,
  amount positive_money_amount not null,
  unique (budget_id, period)
);

alter table public.budget_history enable row level security;

create policy "Usuários veem o histórico dos próprios orçamentos"
  on public.budget_history for select
  using (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id and budgets.user_id = (select auth.uid())
    )
  );

-- O upsert de createBudget/updateBudget precisa das duas: insert (mês novo)
-- e update (mesmo mês editado de novo).
create policy "Usuários criam histórico dos próprios orçamentos"
  on public.budget_history for insert
  with check (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id and budgets.user_id = (select auth.uid())
    )
  );

create policy "Usuários atualizam histórico dos próprios orçamentos"
  on public.budget_history for update
  using (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id and budgets.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.budgets
      where budgets.id = budget_history.budget_id and budgets.user_id = (select auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- Trigger: criação automática de profile + categorias padrão no cadastro
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER: roda com privilégios de quem criou a função, não do
-- usuário que disparou o INSERT em auth.users — necessário porque o usuário
-- recém-criado ainda não tem uma sessão autenticada para passar pela RLS
-- normalmente.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');

  insert into public.categories (user_id, name, type, icon, color)
  values
    (new.id, 'Alimentação', 'expense', 'UtensilsCrossed', '#f59e0b'),
    (new.id, 'Transporte',  'expense', 'Car',             '#3b82f6'),
    (new.id, 'Moradia',     'expense', 'Home',             '#8b5cf6'),
    (new.id, 'Lazer',       'expense', 'Gamepad2',         '#ec4899'),
    (new.id, 'Saúde',       'expense', 'HeartPulse',       '#ef4444'),
    (new.id, 'Educação',    'expense', 'GraduationCap',    '#06b6d4'),
    (new.id, 'Salário',     'income',  'Briefcase',        '#22c55e');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- Um orçamento por categoria por usuário (category_id nulo não conflita)
create unique index budgets_user_category_unique
  on public.budgets (user_id, category_id)
  where category_id is not null;

-- Nomes de categoria únicos por usuário e tipo, sem diferenciar maiúsculas
-- nem espaços nas pontas
create unique index categories_user_name_type_unique
  on public.categories (user_id, lower(btrim(name)), type);

-- Índices nas chaves estrangeiras (consultas do app e RLS). Cobertos por
-- índices únicos já existentes: categories.user_id e budget_history.budget_id.
create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_category_id_idx on public.transactions (category_id);
create index budgets_user_id_idx on public.budgets (user_id);
create index budgets_category_id_idx on public.budgets (category_id);
create index goals_user_id_idx on public.goals (user_id);
create index goal_contributions_goal_id_idx on public.goal_contributions (goal_id);
create index goal_contributions_user_id_idx on public.goal_contributions (user_id);

-- Toda tabela nova no schema public nasce com RLS ligado. Este gatilho já
-- existe no projeto Supabase de produção; aqui ele fica documentado para que
-- um projeto novo fique igual.
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
      exception when others then
        raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    end if;
  end loop;
end;
$$;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();

-- O histórico do mês corrente é gravado pelo banco, não pelo app
create or replace function public.snapshot_budget_history()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.budget_history (budget_id, period, amount)
  values (new.id, to_char(current_date, 'YYYY-MM'), new.target_amount)
  on conflict (budget_id, period) do update set amount = excluded.amount;
  return new;
end;
$$;

create trigger budgets_snapshot_history
  after insert or update of target_amount on public.budgets
  for each row execute function public.snapshot_budget_history();
  
-- ============================================================================
-- Fim do schema.
-- ============================================================================