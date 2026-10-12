
import { TransactionsContent } from "@/components/transactions/transaction-content";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { ExportDialog } from "@/components/transactions/export-dialog";
import { ImportDialog } from "@/components/transactions/import-dialog";

export default function Transactions() {
  return ( 
    <>
      <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Transações
        </h1>
        <div className="flex items-center gap-2">
          <ImportDialog />
          <ExportDialog />
          <TransactionDialog />
        </div>
      </div> 
      <div className="space-y-6 p-6 md:p-8">
          <TransactionsContent  />
      </div>
    </>
  );
}
