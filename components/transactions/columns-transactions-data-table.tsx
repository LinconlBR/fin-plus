"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown , Pencil} from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button"
import { CategoryIcon } from "@/components/categories/category-icons"


import { type DataTableFeatures } from "@/components/ui/data-table/data-table-features"


import { type Transaction } from "@/hooks/use-transactions"

  

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Transaction>()

export const transactionsColumns = columnHelper.columns([
  columnHelper.accessor("title", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  }),
  columnHelper.accessor("category", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Categoria
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transaction = row.original
      const { icon, name, color } = transaction.category
      // Mesmo componente usado no Dashboard (últimas transações) — antes
      // essa coluna mostrava só uma bolinha colorida, sem o ícone real.
      return (
        <div className="flex items-center gap-2">
          <CategoryIcon icon={icon} color={color} />
          {name}
        </div>
      )
    },
  }),
  columnHelper.accessor("amount", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tipo = row.original.type ?? "income"  // Extrai o tipo da categoria (income ou expense)
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount)
 
        if (tipo === "expense") {
          return <div className="text-left font-medium text-expense">{formatted}</div>
        } else {
       return <div className="text-left font-medium text-income" >{formatted}</div>
      }
    },
  }),
  columnHelper.accessor("createdAt", {
    header:  ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const transaction = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <TransactionDialog
            transaction={transaction}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <DeleteTransactionButton id={transaction.id} />
        </div>
      )
    },
  }),

])