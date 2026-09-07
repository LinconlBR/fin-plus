"use client"

import {usePathname} from "next/navigation"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb"

export default function DynamicBreadcrumb() {
  const pathname = usePathname()
console.log (pathname)
  return (
    <Breadcrumb>
                        <BreadcrumbList>
                            
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="#">
                                    <BreadcrumbPage>{pathname.split("/")}</BreadcrumbPage>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
  )

}