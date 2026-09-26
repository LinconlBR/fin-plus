import { GoalsContent } from "@/components/goals/goals-content"
import { GoalDialog } from "@/components/goals/goal-dialog"

export default function Goals() {
  return (
    <>
      <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Metas
        </h1>
        <GoalDialog />
      </div>
      <div className="space-y-6 p-6 md:p-8">
        <GoalsContent />
      </div>
    </>
  )
}
