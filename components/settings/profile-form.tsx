"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { updateProfile } from "@/lib/actions/account"

export function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const [name, setName] = useState(fullName)
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateProfile({ full_name: name })
      setMessage(
        result.error
          ? { type: "error", text: result.error }
          : { type: "ok", text: "Perfil atualizado." }
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>Como você aparece no Fin+.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium">Nome</label>
            <Input
              id="full_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">E-mail</label>
            <Input id="email" value={email} disabled readOnly />
          </div>
          {message && (
            <p
              role={message.type === "error" ? "alert" : "status"}
              className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
            >
              {message.text}
            </p>
          )}
          <Button type="submit" disabled={pending || name.trim() === "" || name.trim() === fullName}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
