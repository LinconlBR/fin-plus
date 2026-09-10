"use client"
// "use client" é obrigatório aqui: useQuery é um hook, e hooks só rodam em Client Components.

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
//  é o createClient de lib/supabase/client.ts (versão do NAVEGADOR),
// não o de lib/supabase/server.ts. Esse arquivo inteiro roda no cliente,
// então precisa da versão que não depende de cookies via next/headers.

// Esse é o formato "cru" que vem direto do Supabase, incluindo o join com categories.
// O "categories" aqui vem como um objeto aninhado, não como texto direto —
// é assim que o Supabase representa o resultado de um relacionamento (foreign key).
type TransactionRow = {
  id: string
  description: string | null
  date: string
  type: "income" | "expense"
  amount: number
  categories: { name: string } | null
}

// Esse é o formato "achatado" que as colunas da tabela esperam — sem aninhamento,
// pronto pra ser exibido direto. A transformação entre os dois formatos acontece
// dentro da função de busca, mais abaixo.
export type Transaction = {
  id: string
  title: string
  category: string
  createdAt: string
  type: "income" | "expense"
  amount: number
}

// Essa é a função que realmente busca e transforma os dados.
// Fica fora do componente/hook porque não depende de nada do React —
// é só lógica pura de busca + transformação.
async function fetchTransactions(): Promise<Transaction[]> {
  const supabase = createClient()

  // O "*, categories(name)" é o mesmo recurso de embedding no
  // dashboard: busca a transação inteira, e junto o nome da categoria relacionada,
  // numa única query — sem precisar de duas buscas separadas.
  const { data, error } = await supabase
    .from("transactions")
    .select("*, categories(name)")
    .order("date", { ascending: false })

  // Se der erro, o TanStack Query precisa que a gente "jogue" (throw) esse erro —
  // é assim que ele sabe marcar a query como isError, e você consegue tratar
  // isso na tela (diferente do padrão de Server Action, que retorna { error }).
  if (error) {
    throw new Error(error.message)
  }

  // Aqui é onde a "tradução" de formato acontece: pegamos cada linha crua
  // (TransactionRow) e devolvemos no formato achatado (Transaction) que a
  // tabela sabe exibir.
  
  return (data as TransactionRow[]).map((row) => ({
    id: row.id,
    title: row.description ?? "Sem descrição",
    // row.categories pode ser null (categoria apagada, lembra da FK com "set null"
    // que configuramos lá no schema) — por isso o fallback "Sem categoria".
    category: row.categories?.name ?? "Sem categoria",
    createdAt: row.date,
    type: row.type,
    amount: Number(row.amount), // mesmo cuidado de sempre: numeric pode vir como string
  }))
}

// Esse é o hook que a página vai usar. Ele só "embrulha" useQuery com a
// configuração certa — a página não precisa saber nada sobre Supabase,
// só chama useTransactions() e recebe o resultado pronto.
export function useTransactions() {
  return useQuery({
    // queryKey identifica essa busca de forma única no cache do TanStack Query —
    // é como uma "chave de dicionário". Se outro componente pedir a mesma
    // queryKey, o TanStack Query reaproveita o cache em vez de buscar de novo.
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
  })
}