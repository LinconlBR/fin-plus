"use client"

import { useState } from "react"

import { useTransactions } from "@/hooks/use-transactions"
import { useCategories } from "@/hooks/use-categories"

import { DataTable } from "./data-table/data-table"
import { columns } from "./data-table/columns"

import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Componente principal que renderiza o conteúdo das transações
export function TransactionsContent() {
  const { data, isLoading, isError } = useTransactions()
  const { data: categories } = useCategories()

  // Os 3 filtros vivem aqui, um useState por campo — o mesmo padrão que você
  // já usou em outros formulários, só que aplicado a filtro em vez de envio.
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all")

  const transactions = data ?? []

  // Aplica os 3 filtros em sequência, um .filter() encadeado no outro —
  // cada um só deixa passar o que já passou no anterior. "all" (valor padrão
  // dos selects) significa "sem filtro nesse campo", por isso o `|| X === "all"`
  // em cada condição.
  const filteredTransactions = transactions
    .filter((t) =>
      search.trim() === ""
        ? true
        : t.title.toLowerCase().includes(search.trim().toLowerCase())
    )
    .filter((t) => categoryFilter === "all" || t.category_id === categoryFilter)
    .filter((t) => typeFilter === "all" || t.type === typeFilter)

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (isError) {
    return <div>Erro ao buscar transações.</div>
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value ?? "all")}
        >
          <SelectTrigger className="w-45">
            <SelectValue placeholder="Categoria">
              {(value: string) =>
                value === "all"
                  ? "Todas as categorias"
                  : categories?.find((c) => c.id === value)?.name
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "all" | "income" | "expense")}
        >
          <SelectTrigger className="w-40">
            <SelectValue>
              {(value: string) =>
                value === "all"
                  ? "Todos os tipos"
                  : value === "income"
                  ? "Receita"
                  : "Despesa"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Receita</SelectItem>
            <SelectItem value="expense">Despesa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredTransactions} />
    </div>
  )
}