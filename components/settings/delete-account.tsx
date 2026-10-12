"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/lib/actions/account"
import { DELETE_CONFIRMATION } from "@/lib/schema/settings"

export function DeleteAccount() {
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onDelete() {
    setError(null)
    startTransition(async () => {
      // Em caso de sucesso a action redireciona para o login.
      const result = await deleteAccount({ confirmation })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-destructive">Excluir conta</CardTitle>
        <CardDescription>
          Apaga permanentemente sua conta e todos os seus dados: transações, orçamentos,
          metas e categorias. Não há como desfazer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog onOpenChange={() => { setConfirmation(""); setError(null) }}>
          <AlertDialogTrigger render={<Button variant="destructive">Excluir minha conta</Button>} />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir a conta?</AlertDialogTitle>
              <AlertDialogDescription>
                Todos os seus dados serão removidos para sempre. Para confirmar, digite{" "}
                <strong>{DELETE_CONFIRMATION}</strong> abaixo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              aria-label="Confirmação"
              autoComplete="off"
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <Button
                variant="destructive-solid"
                disabled={confirmation !== DELETE_CONFIRMATION || pending}
                onClick={onDelete}
              >
                {pending ? "Excluindo..." : "Excluir definitivamente"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
