"use client"

import { useState } from "react"

import { useCategories } from "@/hooks/use-categories"

import { DataTable } from "../ui/data-table/data-table"
import { categoriesColumns } from "@/components/categories/columns-categories-data-table"

import { Input } from "@/components/ui/input"



export function CategoriesContent() {
  const { data, isLoading, isError } = useCategories()

    const [search, setSearch] = useState("")

    const categories = data ?? []

    const filteredCategories = categories.filter((c) =>
      search.trim() === ""
        ? true
        : c.name.toLowerCase().includes(search.trim().toLowerCase())
    )

    if (isLoading) {
      return <div>Carregando...</div>
    }

    if (isError) {
        return <div>Erro ao buscar categorias.</div>
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    placeholder="Buscar por nome..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <DataTable columns={categoriesColumns} data={filteredCategories} />
        </div>
    )

}