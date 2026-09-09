"use client";



import { NuqsAdapter } from "nuqs/adapters/next/app";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableAdvancedToolbar } from "@/components/data-table/data-table-advanced-toolbar";
import { DataTableFilterList } from "@/components/data-table/data-table-filter-list";
import { DataTableSortList } from "@/components/data-table/data-table-sort-list";
import { useDataTable } from "@/hooks/use-data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Tags, Text } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";

type Transaction = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  type: "income" | "expense";
  amount: number;
};

const categoryOptions = [
  { label: "Moradia", value: "Moradia" },
  { label: "Alimentação", value: "Alimentação" },
  { label: "Transporte", value: "Transporte" },
  { label: "Lazer", value: "Lazer" },
  { label: "Salário", value: "Salário" },
];

const typeOptions = [
  { label: "Receita", value: "income" },
  { label: "Despesa", value: "expense" },
];

const data: Transaction[] = [
  { id: "1", title: "Salário mensal", category: "Salário", createdAt: "2026-09-05", type: "income", amount: 8500 },
  { id: "2", title: "Aluguel", category: "Moradia", createdAt: "2026-09-04", type: "expense", amount: 2400 },
  { id: "3", title: "Supermercado Pão de Açúcar", category: "Alimentação", createdAt: "2026-09-03", type: "expense", amount: 386.42 },
  { id: "4", title: "Corrida de aplicativo", category: "Transporte", createdAt: "2026-09-02", type: "expense", amount: 32.9 },
  { id: "5", title: "Restaurante Vila", category: "Alimentação", createdAt: "2026-09-01", type: "expense", amount: 124.8 },
  { id: "6", title: "Freelance de design", category: "Salário", createdAt: "2026-08-30", type: "income", amount: 1250 },
  { id: "7", title: "Cinema e streaming", category: "Lazer", createdAt: "2026-08-28", type: "expense", amount: 79.9 },
  { id: "8", title: "Conta de energia", category: "Moradia", createdAt: "2026-08-26", type: "expense", amount: 218.67 },
  { id: "9", title: "Passagem de ônibus", category: "Transporte", createdAt: "2026-08-25", type: "expense", amount: 96 },
  { id: "10", title: "Reembolso da empresa", category: "Salário", createdAt: "2026-08-23", type: "income", amount: 180 },
  { id: "11", title: "Padaria Central", category: "Alimentação", createdAt: "2026-08-21", type: "expense", amount: 28.5 },
  { id: "12", title: "Show no teatro", category: "Lazer", createdAt: "2026-08-20", type: "expense", amount: 210 },
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const columns: ColumnDef<Transaction>[] = [
  {
    id: "title", 
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Descrição" />
    ),
    cell: ({ row }) => <div>{row.getValue("title")}</div>,
    meta: { label: "Descrição", placeholder: "Buscar transações...", variant: "text", icon: Text },
    enableColumnFilter: true,
  },
  {
    id: "category",
    accessorKey: "category",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Categoria" />,
    cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("category")}</span>,
    meta: { label: "Categoria", variant: "multiSelect", options: categoryOptions, icon: Tags },
    enableColumnFilter: true,
  },
  {
    id: "createdAt",
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Data" />,
    cell: ({ row }) => dateFormatter.format(new Date(`${row.getValue("createdAt")}T12:00:00`)),
    meta: { label: "Data", variant: "date", icon: CalendarDays },
    enableColumnFilter: true,
  },
  {
    id: "type",
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Tipo" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as Transaction["type"];
      return (
        <span className={type === "income" ? "text-emerald-600" : "text-rose-600"}>
          {type === "income" ? "Receita" : "Despesa"}
        </span>
      );
    },
    meta: { label: "Tipo", variant: "select", options: typeOptions },
    enableColumnFilter: true,
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Valor" />,
    cell: ({ row }) => {
      const type = row.getValue("type") as Transaction["type"];
      const amount = row.getValue("amount") as number;
      return (
        <div className="flex items-center justify-end gap-2 font-medium">
          {type === "income" ? <ArrowUpRight className="size-4 text-emerald-600" /> : <ArrowDownLeft className="size-4 text-rose-600" />}
          <span className={type === "income" ? "text-emerald-600" : "text-rose-600"}>
            {type === "income" ? "+" : "-"}{currencyFormatter.format(amount)}
          </span>
        </div>
      );
    },
    meta: { label: "Valor", variant: "number", unit: "R$" },
    enableColumnFilter: true,
  },
];



function TransactionsContent() {
	const { table } = useDataTable({
		data,
		columns,
    pageCount: Math.ceil(data.length / 10),
		initialState: {
		sorting: [{ id: "createdAt", desc: true }],
    pagination: { pageIndex: 0, pageSize: 10 },
		},
		// Unique identifier for rows, can be used for unique row selection
    getRowId: (row: Transaction) => row.id, 
  	});

  return (
    <DataTable table={table}>
			<DataTableAdvancedToolbar table={table}>
				<DataTableFilterList table={table} />
				<DataTableSortList table={table} />
			</DataTableAdvancedToolbar>
		</DataTable>
  )
}

export default function Transactions() {
  return (
    <NuqsAdapter>
      <TransactionsContent />
    </NuqsAdapter>
  );
}
