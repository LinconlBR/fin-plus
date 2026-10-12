"use client"

import { useState } from "react"
import { Download } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { exportFilename, type ExportFormat } from "@/lib/transaction-export"

export function ExportDialog() {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("csv")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onExport() {
    setError(null)
    setLoading(true)
    try {
      const params = new URLSearchParams({ format })
      if (from) params.set("from", from)
      if (to) params.set("to", to)

      const response = await fetch(`/api/transactions/export?${params}`)
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.error ?? "Não foi possível exportar")
      }

      // Baixa pelo navegador sem sair da página (erros viram mensagem, não JSON na tela).
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement("a")
      link.href = url
      link.download = exportFilename(format, from || null, to || null)
      link.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível exportar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Download className="size-4" /> Exportar
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar transações</DialogTitle>
          <DialogDescription>
            Deixe as datas em branco para exportar todas as transações.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label htmlFor="export-from" className="text-sm font-medium">De</label>
              <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label htmlFor="export-to" className="text-sm font-medium">Até</label>
              <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2" role="radiogroup" aria-label="Formato">
            {(["csv", "pdf"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                role="radio"
                aria-checked={format === f}
                variant={format === f ? "default" : "outline"}
                onClick={() => setFormat(f)}
              >
                {f.toUpperCase()}
              </Button>
            ))}
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={onExport} disabled={loading || (!!from && !!to && from > to)}>
            {loading ? "Gerando..." : "Baixar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
