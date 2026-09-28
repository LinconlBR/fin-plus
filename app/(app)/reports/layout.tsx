import { ReportsNav } from "@/components/reports/reports-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"


export default function ReportsLayout({
  children,
}: LayoutProps<"/reports">) {   
    return (
    <>
        <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
            <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Relatórios
            </h1>
        </div>
        <div className="space-y-6 p-6 md:p-8">
            <Suspense fallback={<Skeleton className="h-24 w-full" />}>
                <ReportsNav />
            </Suspense>
            {children}
        </div>
        
    </>
    )
}
