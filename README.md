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
| IA | Google Gemini API (`gemini-2.5-flash`) — insights personalizados |
| Deploy | Vercel |

## Decisões de arquitetura — o que e por quê

Esta seção existe porque, num projeto de aprendizado, entender o raciocínio por trás de
uma escolha vale tanto quanto o código em si.

**Base UI em vez de Radix como base do shadcn/ui.** Composição de componentes usa a prop
`render` (`<Trigger render={<Button />} />`), não `asChild` como no Radix; `Select.Value`
não resolve o rótulo do item selecionado automaticamente (precisa de uma função de
resolução explícita) — diferenças que pegaram mais de uma vez seguindo
tutoriais/documentação escritos para Radix, a opção mais comum no mercado.

**Server Components como padrão; TanStack Query só onde a tela é interativa.**
Dashboard busca dados direto com `await` no servidor. TanStack Query entra
especificamente em telas Client Component por outro motivo (filtro/ordenação
sincronizados na URL em Transações, formulários com validação rica) — ali, cache,
invalidação e reuso valem o custo extra de complexidade.

**RLS (Row Level Security) é a camada real de segurança — não o `proxy.ts`.** Toda
tabela do Supabase tem policies restringindo acesso via `auth.uid()`. O `proxy.ts`
(renomeado de `middleware.ts` na convenção do Next 16) só cuida do redirecionamento
visual; mesmo que fosse contornado, o banco recusaria qualquer query sem o usuário certo.

**Nem todo bloco pronto do shadcn vale a pena reaproveitar.** A tabela de transações
passou por 3 tentativas até chegar no sistema de tabela do **diceui/tablecn** (filtros
facetados, multi-sort, estado na URL) — inclusive corrigindo uma configuração de
`manualFiltering` pensada para paginação no servidor, incompatível com dados carregados
de uma vez via TanStack Query.

**TanStack Form em vez de React Hook Form**, em todos os formulários. Padroniza em
torno do ecossistema TanStack (Query + Table + Form) já usado no resto do projeto.

**Zod `.optional()` vs `z.union([z.string(), z.undefined()])` num campo usado como
validador de formulário do TanStack Form.** `.optional()` gera um tipo de "chave
opcional" (`campo?: string`); o TanStack Form infere os `defaultValues` como "chave
sempre presente, valor pode ser undefined" (`campo: string | undefined`) — tipos
estruturalmente diferentes pro TypeScript, mesmo aceitando os mesmos valores em tempo de
execução. Isso gera um erro de tipo real ao passar o schema como `validators.onSubmit`.
Corrigido usando `z.union([...])` no lugar de `.optional()` sempre que o campo for usado
dessa forma.

**Validação em duas camadas em toda Server Action que recebe dado de formulário**: Zod
no cliente (feedback rápido de UX) e Zod de novo dentro da própria Server Action
(segurança de verdade — alguém pode chamar a função diretamente, pulando o formulário).

**Server Actions chamadas via `mutationFn`/`onClick` não devem usar `redirect()`
internamente**, nem ser chamadas direto no corpo de um componente durante a
renderização. `redirect()` só é interceptado corretamente via `<form action={...}>`;
chamado de outra forma, "vaza" como erro visível (`NEXT_REDIRECT`). E qualquer chamada
assíncrona com efeito colateral (incluindo uma Server Action de IA) precisa passar por
`useQuery`/`useMutation` — chamá-la direto durante o render gera o erro do React "Cannot
update a component while rendering a different component".

**Domains do Postgres para valores monetários.** `positive_money_amount`
(`numeric(12,2)`, `CHECK (VALUE > 0)`) para valores-alvo; `non_negative_money_amount`
(`CHECK (VALUE >= 0)`) para valores acumulados que podem começar em zero (ex:
`current_amount` de uma meta nova) — um domain "positivo estrito" aplicado por engano
nessa coluna rejeitaria o próprio valor padrão.

**Insight de orçamento com IA (Gemini) e fallback baseado em regras.** A versão baseada
em regras (comparação de percentuais, sem custo de API) sempre existe como *fallback*
confiável — a chamada à IA usa `aiInsight || budgetInsight` na exibição, então qualquer
falha de rede/API cai de volta pra uma mensagem funcional, nunca pra tela vazia.

**CRUD de transações e orçamentos num único componente cada** (`TransactionDialog`,
`BudgetsDialog`), não dois separados — criação e edição compartilham quase todos os
campos; uma prop opcional decide o modo.

**Server Actions em vez de rotas de API manuais** para mutações.

**Trigger de banco (`handle_new_user`)** popula `profiles` e categorias padrão
automaticamente no cadastro.

## Schema do banco (Supabase)

5 tabelas em `public`, todas com RLS habilitado:

- **`profiles`** — espelha `auth.users`. Policies de SELECT/UPDATE do próprio perfil.
- **`categories`** — categorias de receita/despesa por usuário, populadas com padrões no
  cadastro.
- **`transactions`** — lançamentos financeiros. FK cascade/set null pra `profiles`/
  `categories`.
- **`budgets`** (renomeada de uma `goals` original) — limite de gasto por categoria e
  período. `is_recurring` decide se o período é recalculado automaticamente
  (semanal/mensal, a partir de hoje) ou se é um intervalo fixo único
  (`start_date`/`end_date` obrigatórios).
- **`goals`** — metas de economia de longo prazo (`target_amount`, `current_amount`,
  `deadline`), conceito diferente de orçamento recorrente.

⚠️ **Furo de dado conhecido, ainda não corrigido**: `category_id` em `transactions` e
`budgets` usa `ON DELETE SET NULL`. Apagar uma categoria deixaria transações e orçamentos
órfãos com `category_id = null`, e o cálculo de gasto por orçamento (que compara
`category_id` de ambos) trataria todos os órfãos como pertencentes uns aos outros
(`null === null`). Não é um problema visível hoje porque **não existe tela de apagar
categoria ainda** — precisa ser resolvido antes de construir essa tela.

## Autenticação

- E-mail/senha com confirmação por e-mail (SMTP próprio pendente — usando o serviço
  embutido do Supabase, limite de 3 e-mails/hora, só para desenvolvimento)
- OAuth com **Google** e **Facebook** (Facebook em modo de desenvolvimento até passar
  por App Review da Meta)

## Funcionalidades implementadas

- [x] Cadastro, login (e-mail + Google + Facebook), logout
- [x] Layout com sidebar persistente, navegação real, breadcrumb dinâmico
- [x] Dashboard com dados reais: saldo/receitas/despesas do mês, gráfico de evolução
- [x] Transações: listagem com filtro/ordenação/paginação real, criação, edição e
      exclusão, validação em duas camadas
- [x] Orçamentos: recorrentes ou únicos, cards com progresso e cores por status
      (normal/atenção/excedido), ordenados por urgência, insight gerado por IA com
      fallback baseado em regras, CRUD completo
- [ ] Metas de economia de longo prazo com acompanhamento de progresso
- [ ] Tela de gerenciar categorias (criar/editar/apagar) — bloqueada até resolver o furo
      de dado descrito acima
- [ ] Relatórios e gráficos analíticos
- [ ] SMTP próprio (Resend/SendGrid/Postmark) — antes do lançamento

## Pendências de limpeza (auditoria de arquitetura)

Levantadas numa revisão completa do projeto, priorizadas numa branch dedicada:

1. Resolver o furo de `category_id = null` antes de mexer em categorias
2. `revalidatePath` residual em `lib/actions/transactions.ts` (sem efeito, já removido
   em `budgets.ts`)
3. Nomenclatura inconsistente em `lib/schema/` (`loginSchema.ts` vs `budgets.ts`)
4. Constraints redundantes em `goals` (duplicam a validação que já vive nos domains)
5. Menu do usuário (`nav-user.tsx`) com itens decorativos em inglês ("Account",
   "Billing", "Upgrade to Pro") sem função real
6. Remover `components/sidebar/nav-projects.tsx` (código morto do template original)

## Rodando localmente

```bash
npm install
```

Crie um arquivo `.env.local` na raiz:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GEMINI_API_KEY=
```

Rode o schema SQL do projeto (tabelas, RLS, trigger, domains) no SQL Editor do seu
projeto Supabase antes de usar o app, e configure os providers OAuth (Google/Facebook)
tanto no Supabase quanto nos respectivos consoles de desenvolvedor.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).