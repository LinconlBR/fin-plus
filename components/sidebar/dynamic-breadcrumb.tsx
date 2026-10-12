"use client"

import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { getBreadcrumbs } from "@/lib/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function DynamicBreadcrumb() {
  const pathname = usePathname()
  const items = getBreadcrumbs(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) =>
          index === items.length - 1 ? (
            <BreadcrumbItem key={item.href}>
              <BreadcrumbPage>{item.label}</BreadcrumbPage>
            </BreadcrumbItem>
          ) : (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
            </Fragment>
          )
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
