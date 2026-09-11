// Hook de consulta que busca e disponibiliza as categorias financeiras pelo cache do TanStack Query.
"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"


type Categories = {
    id: string;
    name: string;
    type: "income" | "expense";
    icon: string;
    color: string;
}

async function fetchCategories(): Promise<Categories[]> { 
    const supabase = createClient()
    const { data, error } = await supabase
    .from("categories")
    .select("*")

    if (error) {
        throw new Error(error.message)
    }

    if (!data) {
        throw new Error("No data returned from categories query")
    }

    return (data as Categories[]).map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        icon: row.icon ?? "default-icon",
        color: row.color ?? "default-color",

    }))

}

export function useCategories() {
  return useQuery({

    queryKey: ["categories"],
    queryFn:  fetchCategories,
  })
}