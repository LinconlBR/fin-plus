"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"


export function NavMain({
  
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {

  const pathname = usePathname()
  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>Plataforma</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          if (item.items && item.items.length > 0) {
            return (
              <Collapsible
                key={item.title}
                defaultOpen={item.isActive}
                className="group/collapsible"
                render={<SidebarMenuItem />}
              >
            <CollapsibleTrigger
              render={<SidebarMenuButton tooltip={item.title} />}
            >
              {item.icon}
              <span>{item.title}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton render={<a href={subItem.url} />}>
                      <span>{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
          )
          } else {
            const isActive = pathname === item.url
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  render={<a href={item.url} />}
                  isActive={isActive}
                  className={cn(
                    "border",
                    isActive
                      ? "border-sidebar-accent-foreground/30 dark:border-transparent dark:shadow-glow-primary"
                      : "border-transparent"
                  )}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          }
        }
      )} 
      </SidebarMenu>
    </SidebarGroup>
  )
}
