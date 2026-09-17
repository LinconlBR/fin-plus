"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { TransactionsContent } from "@/components/transactions/transaction-content";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function Transactions() {
  return (  
    <NuqsAdapter>       
      <div className="flex items-center justify-between  ">
        <span className="text-sm text-muted-foreground">
          Gerencie suas transações
        </span>
        <h1 className="text-2xl font-bold  ">
          Transações
        </h1>
        <TransactionDialog />
      </div>
      <div className="space-y-6 p-6 md:p-8">
          <TransactionsContent  />
      </div>
    </NuqsAdapter>
  );
}
