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

import { useTransactions, type Transaction } from "@/hooks/use-transactions";
import { NewTransactionDialog } from "@/components/transactions/new-transaction-dialog";
// Opções de categoria e tipo para os filtros
const categoryOptions = [
  { label: "Moradia", value: "Moradia" },
  { label: "Alimentação", value: "Alimentação" },
  { label: "Transporte", value: "Transporte" },
  { label: "Lazer", value: "Lazer" },
  { label: "Salário", value: "Salário" },
];

// Opções de tipo para os filtros
const typeOptions = [
  { label: "Receita", value: "income" },
  { label: "Despesa", value: "expense" },
];

// Formatadores para moeda e data
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
// Formatador de data para exibir no formato "dd/MM/yyyy"
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

// Define as colunas da tabela de transações
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


// Componente principal que renderiza o conteúdo das transações
function TransactionsContent() {
     const { data, isLoading, isError } = useTransactions() ;
     const PAGE_SIZE = 10 ;
     const transactions = data ?? [];

     const { table } = useDataTable({
    data: transactions,
    columns,
    pageCount: Math.ceil(transactions.length / PAGE_SIZE),
    initialState: {
    sorting: [{ id: "createdAt", desc: true }],
    pagination: { pageIndex: 0, pageSize: PAGE_SIZE },
    },
    // Unique identifier for rows, can be used for unique row selection
    getRowId: (row: Transaction) => row.id,
    });

     //checando se os dados estão sendo carregados ou se houve algum erro na requisição
        if (isLoading) return <div>Carregando transações...</div>
        if (isError) return <div>Erro ao carregar transações.</div>

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
      <NewTransactionDialog />
      <TransactionsContent />
    </NuqsAdapter>
  );
}
