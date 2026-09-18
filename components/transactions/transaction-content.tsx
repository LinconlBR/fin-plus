"use client"



import { useTransactions} from "@/hooks/use-transactions";

import { DataTable } from "./data-table/data-table";
import { columns } from "./data-table/columns";

// Opções de categoria e tipo para os filtros 
// pegar categorias e tipos do banco de dados para popular essas opções dinamicamente


// Componente principal que renderiza o conteúdo das transações
export function TransactionsContent() {
     const { data, isLoading, isError } = useTransactions();

     const transactions = data ?? []
  if (isLoading) {
    return <div>Carregando...</div>;
  }

  if (isError) {
    return <div>Erro ao buscar transações.</div>;
  }
  
  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={transactions} />
    </div>
  )
}