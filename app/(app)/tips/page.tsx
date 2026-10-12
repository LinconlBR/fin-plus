import { Suspense } from "react"
import { TipsContent } from "@/components/tips/tips-content"
import { Skeleton } from "@/components/ui/skeleton"

export default function Tips() {
  return (
    <>
      <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Dicas financeiras
        </h1>
      </div>
      <div className="space-y-6 p-6 md:p-8">
        <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
          <TipsContent />
        </Suspense>
      </div>
    </>
  )
}
