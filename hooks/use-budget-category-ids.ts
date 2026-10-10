"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

// Ids de TODAS as categorias que já têm orçamento, em qualquer mês.
// Não usa useBudgets(month) de propósito: aquele esconde orçamentos sem
// histórico no mês navegado, e aqui precisamos da lista completa.
async function fetchBudgetCategoryIds(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("budgets")
    .select("category_id")
    .not("category_id", "is", null)

  if (error) throw new Error(error.message)
  return data.map((row) => row.category_id as string)
}

export function useBudgetCategoryIds() {
  return useQuery({
    // Começa com "budgets": o invalidateQueries({ queryKey: ["budgets"] })
    // que o diálogo já faz também atualiza esta lista, sem código extra.
    queryKey: ["budgets", "category-ids"],
    queryFn: fetchBudgetCategoryIds,
  })
}