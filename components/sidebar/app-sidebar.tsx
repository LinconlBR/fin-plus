"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { NavUser } from "@/components/sidebar/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon, LayoutDashboard, ArrowRightLeft, HandCoins, Goal, FrameIcon, PieChartIcon ,ChartColumn, MapIcon, BadgeSwissFranc } from "lucide-react"

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
      url: "/dashboard",
      icon: (
        <HandCoins
        />
      ),
      items: [
       
      ],
    },
    {
      title: "Metas",
      url: "/dashboard",
      icon: (
        <Goal
        />
      ),
      items: [
        
      ],
    },
    {
      title: "Relatorios",
      url: "/dashboard",
      icon: (
        <ChartColumn
        />
      ),
      items: [
        {
          title: "Relatório de Vendas",
          url: "#",
        },
        {
          title: "Relatório de Desempenho",
          url: "#",
        },
      ],
    },
  ],
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
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 text-xl font-bold"> 
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BadgeSwissFranc className="h-5 w-5" />
            </span>
            Fin<span className="relative -ml-2 -top-1 text-primary">+</span>
         </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
