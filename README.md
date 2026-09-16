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
| Deploy | Vercel |

## Decisões de arquitetura — o que e por quê

Esta seção existe porque, num projeto de aprendizado, entender o raciocínio por trás de
uma escolha vale tanto quanto o código em si.

**Base UI em vez de Radix como base do shadcn/ui.** Escolhido na inicialização do
projeto. Principal diferença prática: composição de componentes usa a prop `render`
(`<Trigger render={<Button />} />`), não `asChild` como no Radix — e o `Select.Value` não
resolve o rótulo do item selecionado automaticamente (precisa de uma função de
resolução explícita) — duas diferenças que pegaram mais de uma vez seguindo
tutoriais/documentação escritos para Radix, que é a opção mais comum no mercado.

**Server Components como padrão; TanStack Query só onde a tela é interativa.**
Dashboard busca dados direto com `await` no servidor — sem loading manual, sem
useEffect. TanStack Query entra especificamente em telas que precisam ser Client
Component por outro motivo (a tabela de transações, com filtro/ordenação sincronizados
na URL) — ali, cache, invalidação e reuso valem o custo extra de complexidade.

**RLS (Row Level Security) é a camada real de segurança — não o `proxy.ts`.** Toda
tabela do Supabase tem policies restringindo acesso via `auth.uid()`. O `proxy.ts`
(renomeado de `middleware.ts` na convenção do Next 16) só cuida do redirecionamento
visual; mesmo que fosse contornado, o banco recusaria qualquer query sem o usuário certo.

**Nem todo bloco pronto do shadcn vale a pena reaproveitar.** A tabela de transações
passou por 3 tentativas: o bloco `dashboard-01` (tabela de revisão de documentos, com
drag-and-drop irrelevante ao domínio — descartado), um bloco pago do shadcn.io
(inacessível), até chegar no sistema de tabela do **diceui/tablecn**, que de fato se
encaixa (filtros facetados, multi-sort, estado na URL) e valeu o esforço de adaptação —
inclusive corrigindo, ao longo do caminho, uma configuração de `manualFiltering` que
vinha pensada para paginação/filtro no servidor, incompatível com nosso caso (dados
carregados de uma vez via TanStack Query).

**TanStack Form em vez de React Hook Form**, em todos os formulários (login, signup,
transação). Trocado no meio do caminho, ao perceber que padronizar em torno do
ecossistema TanStack (Query + Table + Form) compensa mais que a base de usuários maior
do React Hook Form, dado que o objetivo aqui é consistência arquitetural.

**Validação em duas camadas em toda Server Action que recebe dado de formulário**: Zod
no cliente (feedback rápido de UX) e Zod de novo dentro da própria Server Action
(segurança de verdade — alguém pode chamar a função diretamente, pulando o formulário).

**Server Actions chamadas via `mutationFn`/`onClick` não devem usar `redirect()`
internamente.** Aprendido na prática: `redirect()` do Next.js só é interceptado
corretamente quando a Server Action é chamada via `<form action={...}>`. Chamada
diretamente (como em `useMutation` ou `onClick`), o redirecionamento "vaza" como um erro
visível (`NEXT_REDIRECT`) na tela. Solução: a Server Action só retorna/lança erro; a
navegação de sucesso acontece no cliente, via `useRouter().push(...)`.

**CRUD de transações num único componente (`TransactionDialog`)**, não dois
separados — criação e edição compartilham quase todos os campos; a prop opcional
`transaction` decide o modo, evitando duplicar o formulário inteiro.

**Server Actions em vez de rotas de API manuais** para mutações. `lib/actions/auth.ts`,
`lib/actions/transactions.ts`. Formulários chamam a função diretamente via `<form
action={minhaFuncao}>` ou `onClick` (caso de itens fora de um `<form>`, como o logout e
o apagar transação), sem `fetch` manual.

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

## Autenticação

- E-mail/senha com confirmação por e-mail (SMTP próprio ainda pendente — usando o
  serviço embutido do Supabase, com limite de 3 e-mails/hora, adequado só para
  desenvolvimento)
- OAuth com **Google** e **Facebook** (Facebook em modo de desenvolvimento até passar
  por App Review da Meta)
- Todos os formulários de auth usam TanStack Form + Zod + `useMutation`

## Funcionalidades implementadas

- [x] Cadastro, login (e-mail + Google + Facebook), logout
- [x] Layout com sidebar persistente, navegação real, breadcrumb dinâmico
- [x] Dashboard com dados reais: saldo/receitas/despesas do mês, gráfico de evolução
- [x] Transações: listagem com filtro/ordenação/paginação real, criação, edição e
      exclusão (com confirmação), validação em duas camadas
- [ ] Orçamentos por categoria
- [ ] Metas de economia com acompanhamento de progresso
- [ ] Relatórios e gráficos analíticos
- [ ] SMTP próprio (Resend/SendGrid/Postmark) — antes do lançamento

## Rodando localmente

```bash
npm install
```

Crie um arquivo `.env.local` na raiz com as credenciais do seu projeto Supabase
(Project Settings → API no dashboard):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Rode o schema SQL do projeto (tabelas, RLS, trigger) no SQL Editor do seu projeto
Supabase antes de usar o app, e configure os providers OAuth (Google/Facebook) tanto no
Supabase quanto nos respectivos consoles de desenvolvedor.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).