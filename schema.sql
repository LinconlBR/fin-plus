-- ============================================================================
-- Fin+ — Schema completo do banco de dados (Supabase / PostgreSQL)
-- ============================================================================
-- Roda esse arquivo inteiro no SQL Editor de um projeto Supabase novo pra
-- recriar toda a estrutura de dados do zero: extensões, domains, tabelas,
-- constraints, Row Level Security e o trigger de cadastro.
--
-- Ordem importa: domains antes das tabelas que os usam; tabelas na ordem de
-- dependência de foreign key (profiles → categories → transactions/budgets;
-- profiles → goals).
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

create domain non_negative_money_amount as numeric(12,2)
  check (value >= 0);
-- Uso: valores acumulados que podem legitimamente começar em zero
-- (ex: current_amount de uma meta recém-criada).

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
  using (auth.uid() = id);

create policy "Usuários atualizam o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

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
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
  using (auth.uid() = user_id);

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
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
  current_amount non_negative_money_amount not null default 0,
  deadline date
);

alter table public.goals enable row level security;

create policy "Usuários gerenciam as próprias metas"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

-- ============================================================================
-- Fim do schema.
-- ============================================================================
