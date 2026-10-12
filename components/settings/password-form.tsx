"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { changePassword } from "@/lib/actions/account"

const empty = { current_password: "", new_password: "", confirm_password: "" }

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [values, setValues] = useState(empty)
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  if (!hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Segurança</CardTitle>
          <CardDescription>
            Você entra com uma conta Google ou Facebook, então a senha é gerenciada por lá.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await changePassword(values)
      if (result.error) {
        setMessage({ type: "error", text: result.error })
      } else {
        setValues(empty)
        setMessage({ type: "ok", text: "Senha alterada." })
      }
    })
  }

  const field = (id: keyof typeof empty, label: string, autoComplete: string) => (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={values[id]}
        onChange={(e) => setValues((v) => ({ ...v, [id]: e.target.value }))}
        required
      />
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>Altere a senha de acesso.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          {field("current_password", "Senha atual", "current-password")}
          {field("new_password", "Nova senha", "new-password")}
          {field("confirm_password", "Confirmar nova senha", "new-password")}
          {message && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Alterando..." : "Alterar senha"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
