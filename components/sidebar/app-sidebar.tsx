"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
//import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {  LayoutDashboard, ArrowRightLeft, HandCoins, Goal  ,ChartColumn , BadgeSwissFranc, Settings, Lightbulb } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: (
        <LayoutDashboard
        />
      ),
      isActive: true,
      items: [],
    },
    {
      title: "Transações",
      url: "/transactions",
      icon: (
        <ArrowRightLeft
        />
      ),
      items: [
       
      ],
    },
    {
      title: "Orçamentos",
      url: "/budgets",
      icon: (
        <HandCoins
        />
      ),
      items: [
       
      ],
    },
    {
      title: "Metas",
      url: "/goals",
      icon: (
        <Goal
        />
      ),
      items: [
        
      ],
    },
    {
      title: "Relatórios",
      url: "/reports",
      icon: (
        <ChartColumn
        />
      ),
      items: [
        {
          title: "Gastos por categoria",
          url: "/reports/category-expenses",
        },
        {
          title: "Receitas vs despesas",
          url: "/reports/income-vs-expenses",
        },
      ],
    },
    {
      title: "Dicas financeiras",
      url: "/tips",
      icon: (
        <Lightbulb
        />
      ),
      items: [
        
      ],
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: (
        <Settings
        />
      ),
      items: [
        
      ],
    },
  ],
  /*
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: (
        <FrameIcon
        />
      ),
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: (
        <PieChartIcon
        />
      ),
    },
    {
      name: "Travel",
      url: "#",
      icon: (
        <MapIcon
        />
      ),
    },
  ],
  */
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { name: string; email: string; avatar: string }
}) {

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 text-xl font-bold"> 
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BadgeSwissFranc className="h-5 w-5" />
            </span>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold ">Fin <span className="text-primary">+</span></span>
            </div>
         </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
