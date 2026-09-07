import { AppSidebar } from "@/components/sidebar/app-sidebar"
import DynamicBreadcrumb from "@/components/sidebar/dynamic-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createClient } from "@/lib/supabase/server"



export default async function Layout({ children }: { children: React.ReactNode }) {
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single()

  return (
    <SidebarProvider>
      <AppSidebar user={{ name: profile?.full_name ?? "", email: user?.email ?? "", avatar: "/avatar.svg"}} />
      <main>
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator
                    orientation="vertical"
                    className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                    />
                    <DynamicBreadcrumb />
                </div>
            </header>
        {children}
        </SidebarInset>
      </main>
    </SidebarProvider>

    
  )
}