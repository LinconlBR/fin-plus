"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { CategoryRule } from "@/lib/categorize"

async function fetchCategoryRules(): Promise<CategoryRule[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("category_rules")
    .select("merchant_key, type, category_id")
  if (error) throw new Error(error.message)
  return (data ?? []) as CategoryRule[]
}

export function useCategoryRules() {
  return useQuery({
    queryKey: ["category-rules"],
    queryFn: fetchCategoryRules,
  })
}
