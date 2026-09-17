"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TransactionsContent } from "@/components/transactions/transaction-content";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function Transactions() {
  return (  
    <NuqsAdapter>      
      <div className="border-b bg-background px-6 py-5 text-center md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Transações
        </h1>
      </div>
        
      
      <div className="space-y-6 p-6 md:p-8">
          <TransactionsContent  />
      </div>
      <div className="fixed top-4 right-4 z-50">
        <TransactionDialog />
      </div>
    </NuqsAdapter>
  );
}
