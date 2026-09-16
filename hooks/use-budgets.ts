"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

type budgetRow = {
  id: string
  category_id: string | null
  category: { name: string } | null
  target_amount: string | null
  period: "weekly" | "monthly" | null
  start_date: string
  end_date: string | null
  is_recurring: boolean
}

export type Budget = {
    id: string
    category_id: string
    category: string
    targetAmount: number
    period: "weekly" | "monthly" | null
    startDate: string
    endDate: string | null
    isRecurring: boolean
}

export async function fetchBudgets(): Promise<Budget[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from("budgets")
        .select("*, category:categories(name)")
        .order("start_date", { ascending: false })
        .throwOnError()
    return data.map((budget) => ({
        id: budget.id,
        category_id: budget.category_id,
        category: budget.category?.name || "",
        targetAmount: budget.target_amount ? parseFloat(budget.target_amount) : 0,
        period: budget.period,
        startDate: budget.start_date,
        endDate: budget.end_date,
        isRecurring: budget.is_recurring
    }))
}
