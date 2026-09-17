
import { BudgetsDialog } from "@/components/budgets/budgets-dialog";
import { BudgetsContent } from "@/components/budgets/budgets-content";

export default function Budgets() {
  return (  
    <>
        <div className="border-b bg-background px-6 py-5 text-center md:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Orçamentos
            </h1>
        </div>
        <div className="space-y-6 p-6 md:p-8">
            <BudgetsContent />
        </div>
        <div className="fixed bottom-4 right-4 z-50">
            <BudgetsDialog />
        </div>
    </>
  );
}