# Fin+

Web app de acompanhamento financeiro pessoal — permite registrar receitas e despesas,
visualizar hábitos de consumo e acompanhar metas de economia alinhadas aos objetivos do
usuário.

## Visão do produto

A maioria dos apps de finanças (Mobills, Organizze, GuiaBolso) foca só em **registrar e
categorizar** gastos. O Fin+ fecha o ciclo: **registro → análise → ajuste de
comportamento** — conectando o que o usuário gasta às metas que ele definiu, em vez de só
mostrar números passados.

## Stack técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS v4 + shadcn/ui (primitives Base UI) |
| Backend / Banco | Supabase (PostgreSQL + Auth + Row Level Security) |
| Formulários | React Hook Form + Zod (via `@hookform/resolvers`) |
| Estado / cache | TanStack Query, Zustand |
| Deploy | Vercel |

## Arquitetura e decisões-chave

- **Server Actions em vez de rotas de API manuais** para mutações (login, cadastro) —
  `lib/actions/auth.ts`. O formulário chama a função diretamente via `<form
  action={minhaFuncao}>`, sem `fetch` manual.
- **Row Level Security (RLS) como camada real de segurança**, não o `proxy.ts`. Toda
  tabela tem policies restringindo acesso a `auth.uid() = user_id` (ou `= id`, em
  `profiles`). O proxy só cuida da experiência de redirecionamento; a defesa de dado
  mora no banco.
- **`proxy.ts` em vez de `middleware.ts`** — convenção do Next.js 16, que renomeou o
  arquivo e a função (`middleware` → `proxy`).
- **Trigger de banco (`handle_new_user`)** popula automaticamente a tabela `profiles`
  quando um usuário se cadastra em `auth.users`, lendo `full_name` do
  `raw_user_meta_data` enviado no `signUp()`.
- **Categorias e valores como `numeric(12,2)`**, nunca `float`, para evitar erro de
  arredondamento em valores monetários.

## Schema do banco (Supabase)

4 tabelas em `public`, todas com RLS habilitado:

- **`profiles`** — espelha `auth.users` (id é FK 1:1, sem gerar UUID novo). Policies de
  SELECT/UPDATE do próprio perfil.
- **`categories`** — categorias de receita/despesa por usuário. `type` restrito a
  `income`/`expense` via CHECK constraint.
- **`transactions`** — lançamentos financeiros. FK para `profiles` (cascade) e
  `categories` (set null — apagar categoria não apaga histórico).
- **`goals`** — metas de economia. `period` restrito a `weekly`/`monthly`.

## Funcionalidades implementadas

- [x] Cadastro de usuário com confirmação de e-mail (`app/auth/signup`)
- [x] Login com sessão persistida via cookies (`app/auth/login`)
- [x] Redirecionamento automático de rotas protegidas via `proxy.ts`
- [x] Dashboard inicial autenticado, exibindo dados reais do perfil (`app/dashboard`)
- [ ] CRUD de transações
- [ ] Orçamentos por categoria
- [ ] Metas de economia com acompanhamento de progresso
- [ ] Relatórios e gráficos

## Rodando localmente

```bash
npm install
```

Crie um arquivo `.env.local` na raiz com as credenciais do seu projeto Supabase
(Project Settings → API no dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Rode o schema SQL do projeto (tabelas, RLS, trigger) no SQL Editor do seu projeto
Supabase antes de usar o app.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).