"use client"


//import { Button } from "@/components/ui/button";



//import { ArrowDownLeft, ArrowUpRight, CalendarDays, Tags, Text, Pencil } from "lucide-react";


//import { TransactionDialog } from "@/components/transactions/transaction-dialog";

//import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button";
import { useTransactions} from "@/hooks/use-transactions";
//import { useCategories, type Categories } from "@/hooks/use-categories"; 
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