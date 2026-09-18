"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown , Pencil} from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button"


import { type DataTableFeatures } from "./data-table-features"


import { type Transaction } from "@/hooks/use-transactions"

  

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Transaction>()

export const columns = columnHelper.columns([
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
      return (
        <div className="flex items-center gap-2" style={{ color }}>
          {icon && (
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color  }}
            />
          )}
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
          return <div className="text-left font-medium text-red-500">{formatted}</div>
        } else {      
       return <div className="text-left font-medium text-green-500" >{formatted}</div>
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