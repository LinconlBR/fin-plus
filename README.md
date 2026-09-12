# Fin+

Web app de acompanhamento financeiro pessoal — permite registrar receitas e despesas,
visualizar hábitos de consumo e acompanhar metas de economia alinhadas aos objetivos do
usuário.

Este projeto também é meu processo de aprendizado prático de Next.js, TypeScript e
Supabase — o README documenta não só o que foi construído, mas **por que** cada decisão
de arquitetura foi tomada.

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
| Estilização | Tailwind CSS v4 + shadcn/ui, sobre **Base UI** (não Radix) |
| Backend / Banco | Supabase (PostgreSQL + Auth + Row Level Security) |
| Formulários | TanStack Form + Zod |
| Dados assíncronos | TanStack Query (telas interativas) / Server Components (leitura simples) |
| Tabelas | TanStack Table (via componentes do diceui/tablecn) |
| Estado local de UI | Zustand |
| Deploy | Vercel |

## Decisões de arquitetura — o que e por quê

Esta seção existe porque, num projeto de aprendizado, entender o raciocínio por trás de
uma escolha vale tanto quanto o código em si.

**Base UI em vez de Radix como base do shadcn/ui.** Escolhido na inicialização do
projeto. Principal diferença prática: composição de componentes usa a prop `render`
(`<Trigger render={<Button />} />`), não `asChild` como no Radix — isso pegou mais de uma
vez ao seguir tutoriais/documentação escritos para Radix, que é a opção mais comum no
mercado.

**Server Components como padrão; TanStack Query só onde a tela é interativa.**
Dashboard e páginas de leitura simples buscam dados direto com `await` no servidor — sem
loading manual, sem useEffect. TanStack Query entra especificamente nas telas que
precisam ser Client Component por outro motivo (ex: a tabela de transações, que tem
filtro/ordenação sincronizados com a URL) — ali, cache, invalidação e reuso valem o custo
extra de complexidade.

**RLS (Row Level Security) é a camada real de segurança — não o `proxy.ts`.** Toda
tabela do Supabase tem policies restringindo acesso via `auth.uid()`. O `proxy.ts`
(renomeado de `middleware.ts` na convenção do Next 16) só cuida do redirecionamento
visual; mesmo que fosse contornado, o banco recusaria qualquer query sem o usuário certo.

**Nem todo bloco pronto do shadcn vale a pena reaproveitar.** A tabela de transações
passou por 3 tentativas: o bloco `dashboard-01` (tabela de revisão de documentos, com
drag-and-drop irrelevante ao domínio — descartado), um bloco simples do shadcn.io (pago,
inacessível), até chegar no sistema de tabela do **diceui/tablecn**, que de fato se encaixa
(filtros facetados, multi-sort, estado na URL) e vale o esforço de adaptação.

**TanStack Form em vez de React Hook Form.** Trocado depois do formulário de transação já
estar parcialmente construído com React Hook Form, ao perceber que padronizar em torno do
ecossistema TanStack (Query + Table + Form) — já usado no restante do projeto — compensa
mais que a base de usuários maior do React Hook Form, dado que o objetivo aqui é
consistência arquitetural, não só "o que é mais popular".

**Server Actions em vez de rotas de API manuais** para mutações. `lib/actions/auth.ts`,
`lib/actions/transactions.ts`. Formulários chamam a função diretamente via `<form
action={minhaFuncao}>` ou `onClick` (caso de itens fora de um `<form>`, como o logout na
sidebar), sem `fetch` manual.

**Trigger de banco (`handle_new_user`)** popula `profiles` e categorias padrão
automaticamente quando um usuário se cadastra, lendo `full_name` do `raw_user_meta_data`
enviado no `signUp()`.

**Valores monetários como `numeric(12,2)`**, nunca `float` — evita erro de arredondamento.

## Schema do banco (Supabase)

4 tabelas em `public`, todas com RLS habilitado:

- **`profiles`** — espelha `auth.users` (id é FK 1:1, sem gerar UUID novo). Policies de
  SELECT/UPDATE do próprio perfil.
- **`categories`** — categorias de receita/despesa por usuário. `type` restrito a
  `income`/`expense` via CHECK constraint. Populadas com categorias padrão no cadastro.
- **`transactions`** — lançamentos financeiros. FK para `profiles` (cascade) e
  `categories` (set null — apagar categoria não apaga histórico).
- **`goals`** — metas de economia. `period` restrito a `weekly`/`monthly`.

## Funcionalidades implementadas

- [x] Cadastro com confirmação de e-mail e login (`app/auth/`)
- [x] Redirecionamento automático de rotas protegidas via `proxy.ts`
- [x] Layout com sidebar persistente, navegação real, breadcrumb dinâmico, logout
- [x] Dashboard com dados reais: saldo/receitas/despesas do mês, gráfico de evolução
- [x] Listagem de transações com filtro, ordenação e paginação (dados reais via TanStack
      Query)
- [ ] Criação de transação (formulário em andamento — TanStack Form)
- [ ] Orçamentos por categoria
- [ ] Metas de economia com acompanhamento de progresso
- [ ] Relatórios e gráficos analíticos

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