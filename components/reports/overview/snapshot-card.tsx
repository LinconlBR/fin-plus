import type { ReactNode } from "react"
import Link from "next/link"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Moldura comum dos blocos da Visão geral: título + "Ver completo →" + conteúdo.
export function SnapshotCard({
  title,
  subtitle,
  href,
  children,
}: {
  title: string
  subtitle?: string
  href?: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
        {href && (
          <CardAction>
            <Link
              href={href}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Ver completo →
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}