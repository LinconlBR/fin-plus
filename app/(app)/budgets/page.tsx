import { NuqsAdapter } from "nuqs/adapters/next/app";
import { BudgetsDialog } from "@/components/budgets/budgets-dialog";
import { BudgetsContent } from "@/components/budgets/budgets-content";
export default function Budgets() {
  return (  
    <NuqsAdapter>

      <div className="flex items-center justify-between  ">
        <span className="text-sm text-muted-foreground">
          Gerencie seus orçamentos
        </span>
        <h1 className="text-2xl font-bold  ">
          Orçamentos
        </h1>
        <BudgetsDialog />
      </div>
      <div className="space-y-6 p-6 md:p-8">
          <BudgetsContent />
      </div>
    </NuqsAdapter>
  );
}