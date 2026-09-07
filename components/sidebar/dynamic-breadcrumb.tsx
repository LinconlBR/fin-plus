"use client"

import {usePathname} from "next/navigation"
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


  return (
    <Breadcrumb>
        <BreadcrumbList>
        {pathname.split("/").filter(Boolean) .map((segment, index, array) => {
            if (index === array.length - 1) {
                return (
                    <BreadcrumbItem key={segment}>
                        <BreadcrumbPage>
                            {segment}
                        </BreadcrumbPage>
                    </BreadcrumbItem>
                )
            }
            return (  
                <>
                <BreadcrumbItem key="hidden md:block">
                    <BreadcrumbLink href={`/${segment}`}>
                        {segment}
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
             </>)
        })}
            <BreadcrumbItem key="">
                <BreadcrumbLink href="#">
                    
                </BreadcrumbLink>
            </BreadcrumbItem>
        </BreadcrumbList>
    </Breadcrumb>
  )

}