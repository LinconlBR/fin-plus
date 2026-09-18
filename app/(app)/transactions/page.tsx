
import { TransactionsContent } from "@/components/transactions/transaction-content";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

export default function Transactions() {
  return ( 
    <>
      <div className="flex items-center justify-between border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Transações
        </h1>
        <TransactionDialog />
      </div> 
      <div className="space-y-6 p-6 md:p-8">
          <TransactionsContent  />
      </div>
    </>
  );
}
