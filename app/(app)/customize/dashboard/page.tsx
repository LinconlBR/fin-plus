import { DashboardLayoutEditor } from "@/components/customize/dashboard-layout-editor"
import { getDashboardLayout } from "@/lib/preferences"

export default async function CustomizeDashboard() {
  const layout = await getDashboardLayout()

  return (
    <>
      <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Personalizar Dashboard
        </h1>
      </div>
      <div className="p-6 md:p-8">
        <DashboardLayoutEditor initialLayout={layout} />
      </div>
    </>
  )
}
