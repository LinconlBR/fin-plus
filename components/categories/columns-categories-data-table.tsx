"use client"

import { createColumnHelper } from "@tanstack/react-table"
import { ArrowUpDown , Pencil} from "lucide-react"
 
import { Button } from "@/components/ui/button"
import { DeleteCategoryButton } from "@/components/categories/delete-category-button"
import { type DataTableFeatures } from "@/components/ui/data-table/data-table-features"

import { CategoryIcon } from "@/components/categories/category-icons"
import { type Category } from "@/hooks/use-categories"
import { CategoryDialog } from "./category-dialog"

// Use `accessor` for data columns and `display` for columns without one.
const columnHelper = createColumnHelper<DataTableFeatures, Category>()

export const categoriesColumns = columnHelper.columns([
  columnHelper.accessor("name", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Título
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tipo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
        <span className={row.original.type === "income" ? "text-income" : "text-expense"}>
        {row.original.type === "income" ? "Receita" : "Despesa"}
        </span>
    ),
  }),
  columnHelper.accessor("icon", {
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Ícone
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
        <CategoryIcon icon={row.original.icon} color={row.original.color} />
    ),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => {
      const category = row.original
      return (
        <div className="flex items-center justify-end gap-1">
          <CategoryDialog
            category={category}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="size-4" />
              </Button>
            }
          />
          <DeleteCategoryButton id={category.id} />
        </div>
      )
    },
  }),

])