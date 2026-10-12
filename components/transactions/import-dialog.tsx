"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Upload } from "lucide-react"

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
import { useCategories } from "@/hooks/use-categories"
import { useTransactions } from "@/hooks/use-transactions"
import { useCategoryRules } from "@/hooks/use-category-rules"
import { importTransactions } from "@/lib/actions/transactions-import"
import { saveCategoryRules } from "@/lib/actions/category-rules"
import {
  buildHistoryIndex,
  createSuggester,
  selectRulesToLearn,
  type SuggestionSource,
} from "@/lib/categorize"
import { parseCsv } from "@/lib/csv"
import { cellsToTable } from "@/lib/spreadsheet"
import { formatCurrency, formatDate } from "@/lib/format"
import { MAX_IMPORT_ROWS } from "@/lib/schema/transaction-import"
import {
  buildImportRows,
  detectColumns,
  filterImportWindow,
  findHeaderRow,
  isMappingUsable,
  markDuplicates,
  type ColumnField,
  type ColumnMapping,
  type ImportRow,
} from "@/lib/transaction-import"

const MAX_FILE_BYTES = 2 * 1024 * 1024
const MAX_PDF_BYTES = 4 * 1024 * 1024

function normalizeName(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

type PreviewRow = ImportRow & {
  duplicate: boolean
  include: boolean
  category_id: string
  // De onde veio a categoria sugerida (null = nenhuma sugestão, caiu na padrão).
  source: SuggestionSource | null
  // A pessoa mexeu na categoria desta linha.
  touched: boolean
}
type Step = "upload" | "map" | "preview"

const FIELD_LABELS: Record<ColumnField, string> = {
  date: "Data",
  description: "Descrição",
  amount: "Valor",
  debit: "Débito",
  credit: "Crédito",
  type: "Tipo (receita/despesa)",
  category: "Categoria (opcional)",
}

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm dark:bg-input/30"

export function ImportDialog() {
  const queryClient = useQueryClient()
  const { data: categories = [] } = useCategories()
  const { data: existing = [] } = useTransactions()
  const { data: rules = [] } = useCategoryRules()

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [error, setError] = useState<string | null>(null)
  const [table, setTable] = useState<string[][]>([])
  const [headerIndex, setHeaderIndex] = useState(0)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [rows, setRows] = useState<PreviewRow[]>([])
  const [notes, setNotes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const incomeCategories = categories.filter((c) => c.type === "income")
  const expenseCategories = categories.filter((c) => c.type === "expense")

  function reset() {
    setStep("upload")
    setError(null)
    setTable([])
    setRows([])
    setNotes([])
    setMapping({})
  }

  // Monta a prévia a partir da tabela e do mapeamento atuais.
  function buildPreview(nextTable: string[][], nextHeader: number, nextMapping: ColumnMapping) {
    const { rows: parsed, issues } = buildImportRows(nextTable, nextHeader, nextMapping)
    showPreview(parsed, issues, [])
  }

  // Ponto comum de CSV, XLSX e PDF: daqui para frente é tudo ImportRow.
  function showPreview(parsed: ImportRow[], issues: { line: number; reason: string }[], extraNotes: string[]) {
    const { inside, before, future } = filterImportWindow(parsed)

    if (inside.length > MAX_IMPORT_ROWS) {
      setError(`O arquivo tem ${inside.length} transações nos últimos 3 meses. Importe no máximo ${MAX_IMPORT_ROWS} por vez.`)
      return
    }
    if (inside.length === 0) {
      setError("Nenhuma transação dos últimos 3 meses foi encontrada neste arquivo.")
      return
    }

    const defaultIncome = incomeCategories[0]?.id ?? ""
    const defaultExpense = expenseCategories[0]?.id ?? ""
    const marked = markDuplicates(
      inside,
      existing.map((t) => ({ date: t.date, description: t.title, amount: t.amount, type: t.type }))
    )

    // Sugestão: regra aprendida > histórico > dicionário. Sem nada, categoria
    // padrão do tipo, marcada para revisão.
    const suggest = createSuggester({
      categories,
      rules,
      history: buildHistoryIndex(
        existing.map((t) => ({ description: t.title, type: t.type, category_id: t.category_id })),
        new Set(categories.map((c) => c.id))
      ),
    })

    setRows(
      marked.map((row) => {
        // Categoria que veio no próprio arquivo (mesmo tipo) vale mais que qualquer palpite.
        const fromFile = row.categoryName
          ? categories.find(
              (c) => c.type === row.type && normalizeName(c.name) === normalizeName(row.categoryName!)
            )
          : undefined
        const suggestion = fromFile
          ? { category_id: fromFile.id, source: "file" as const }
          : suggest(row.description, row.type)
        return {
          ...row,
          include: !row.duplicate,
          category_id:
            suggestion?.category_id ?? (row.type === "income" ? defaultIncome : defaultExpense),
          source: suggestion?.source ?? null,
          touched: false,
        }
      })
    )

    const info: string[] = [...extraNotes]
    if (before > 0) info.push(`${before} anteriores aos últimos 3 meses foram ignoradas.`)
    if (future > 0) info.push(`${future} com data futura foram ignoradas.`)
    if (issues.length > 0) info.push(`${issues.length} linhas não puderam ser lidas (ex.: linha ${issues[0].line}: ${issues[0].reason.toLowerCase()}).`)
    setNotes(info)
    setError(null)
    setStep("preview")
  }

  async function onPdf(file: File) {
    setLoading(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const response = await fetch("/api/transactions/parse-statement", { method: "POST", body })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.rows) {
        setError(result?.error ?? "Não consegui ler este PDF.")
        return
      }
      showPreview(result.rows as ImportRow[], [], result.notices ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf"
    const limit = isPdf ? MAX_PDF_BYTES : MAX_FILE_BYTES
    if (file.size > limit) {
      setError(`O arquivo é grande demais (máximo ${limit / 1024 / 1024} MB).`)
      return
    }
    try {
      if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
        await onPdf(file)
        return
      }
      const isXlsx = /\.xlsx$/i.test(file.name)
      if (/\.xls$/i.test(file.name)) {
        setError("Arquivos .xls antigos não são aceitos. Exporte como .xlsx ou CSV.")
        return
      }
      // Carrega o leitor de planilhas só quando alguém escolhe um XLSX.
      const parsed = isXlsx
        ? cellsToTable(
            await (await import("read-excel-file/universal")).readSheet(file)
          )
        : parseCsv(await file.text())
      if (parsed.length < 2) {
        setError("Não encontrei linhas de dados neste arquivo.")
        return
      }
      const found = findHeaderRow(parsed)
      const header = found === -1 ? 0 : found
      const detected = detectColumns(parsed[header])
      setTable(parsed)
      setHeaderIndex(header)
      setMapping(detected)

      if (found === -1 || !isMappingUsable(detected)) {
        setStep("map")
      } else {
        buildPreview(parsed, header, detected)
      }
    } catch (e) {
      // O detalhe vai para o console: sem ele, "pacote não instalado" e
      // "arquivo corrompido" aparecem como a mesma mensagem.
      console.error("Erro ao ler o arquivo de extrato:", e)
      setError("Não consegui ler este arquivo. Use um CSV ou XLSX.")
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = rows
        .filter((r) => r.include)
        .map(({ date, description, amount, type, category_id }) => ({ date, description, amount, type, category_id }))
      const result = await importTransactions(payload)
      if ("error" in result) throw new Error(result.error)
      return result
    },
    onSuccess: () => {
      // Ensina as regras com o que a pessoa confirmou. É só uma ajuda para a
      // próxima importação: se falhar, a importação em si já deu certo.
      const learned = selectRulesToLearn(rows)
      if (learned.length > 0) {
        saveCategoryRules(learned)
          .catch(() => undefined)
          .finally(() => queryClient.invalidateQueries({ queryKey: ["category-rules"] }))
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      setOpen(false)
      reset()
    },
    onError: (e: Error) => setError(e.message),
  })

  const selected = rows.filter((r) => r.include)
  const missingCategory = selected.some((r) => !r.category_id)
  const headers = useMemo(() => table[headerIndex] ?? [], [table, headerIndex])

  function setAllCategory(type: "income" | "expense", category_id: string) {
    // A categoria padrão só vale para linhas sem sugestão e que ninguém mexeu.
    setRows((current) =>
      current.map((r) =>
        r.type === type && r.source === null && !r.touched ? { ...r, category_id } : r
      )
    )
  }

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset() }}>
      <DialogTrigger
        render={
          <Button variant="outline">
            <Upload className="size-4" /> Importar
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar extrato</DialogTitle>
          <DialogDescription>
            Traz as transações dos últimos 3 meses de um CSV, XLSX ou PDF do seu banco. Você revisa tudo antes de salvar.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-2">
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.pdf,text/csv,application/pdf"
              onChange={(e) => onFile(e.target.files?.[0])}
              aria-label="Arquivo do extrato (CSV, XLSX ou PDF)"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-transparent file:px-3 file:py-1.5 file:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Aceita CSV, XLSX ou PDF de qualquer banco (PDF com texto selecionável, até 4 MB).
            </p>
            {loading && <p className="text-sm">Lendo o extrato...</p>}
            <p className="text-xs text-muted-foreground">
              PDFs com layout desconhecido podem ser lidos com IA: nesse caso o texto do extrato,
              sem titular, número de conta nem cartão, é enviado ao serviço de IA.
            </p>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-3">
            <p className="text-sm">Não consegui identificar as colunas sozinho. Diga qual é qual:</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(FIELD_LABELS) as ColumnField[]).map((field) => (
                <label key={field} className="grid gap-1 text-sm">
                  {FIELD_LABELS[field]}
                  <select
                    className={selectClass}
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => {
                        const next = { ...m }
                        if (e.target.value === "") delete next[field]
                        else next[field] = Number(e.target.value)
                        return next
                      })
                    }
                  >
                    <option value="">—</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Obrigatório: data e valor (ou débito/crédito).</p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            {notes.map((n) => (
              <p key={n} className="text-xs text-muted-foreground">{n}</p>
            ))}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                Categoria padrão das receitas (sem sugestão)
                <select className={selectClass} onChange={(e) => setAllCategory("income", e.target.value)}
                  defaultValue={incomeCategories[0]?.id ?? ""}>
                  {incomeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                Categoria padrão das despesas (sem sugestão)
                <select className={selectClass} onChange={(e) => setAllCategory("expense", e.target.value)}
                  defaultValue={expenseCategories[0]?.id ?? ""}>
                  {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            </div>

            <div className="max-h-80 overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left">
                  <tr>
                    <th className="p-2" />
                    <th className="p-2">Data</th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Categoria</th>
                    <th className="p-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const options = row.type === "income" ? incomeCategories : expenseCategories
                    return (
                      <tr key={i} className={row.include ? "" : "opacity-50"}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            aria-label={`Importar ${row.description}`}
                            onChange={(e) =>
                              setRows((cur) => cur.map((r, j) => (j === i ? { ...r, include: e.target.checked } : r)))
                            }
                          />
                        </td>
                        <td className="p-2 whitespace-nowrap">{formatDate(row.date)}</td>
                        <td className="p-2">
                          {row.description}
                          {row.duplicate && <span className="ml-2 text-xs text-amber-600">já existe</span>}
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                          <select
                            className={selectClass}
                            value={row.category_id}
                            aria-label={`Categoria de ${row.description}`}
                            onChange={(e) =>
                              setRows((cur) =>
                                cur.map((r, j) =>
                                  j === i ? { ...r, category_id: e.target.value, touched: true } : r
                                )
                              )
                            }
                          >
                            {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          {!row.touched && row.source === null && (
                            <span className="text-xs text-amber-600">revisar</span>
                          )}
                          {!row.touched && row.source !== null && (
                            <span className="text-xs text-muted-foreground">
                              {row.source === "dictionary"
                                ? "sugerida"
                                : row.source === "file"
                                  ? "do arquivo"
                                  : "aprendida"}
                            </span>
                          )}
                          </div>
                        </td>
                        <td className={`p-2 text-right whitespace-nowrap ${row.type === "income" ? "text-green-600" : "text-red-600"}`}>
                          {row.type === "income" ? "+" : "-"}{formatCurrency(row.amount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          {step === "map" && (
            <Button
              disabled={!isMappingUsable(mapping)}
              onClick={() => buildPreview(table, headerIndex, mapping)}
            >
              Continuar
            </Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => { setError(null); setStep("map") }}>
                Ajustar colunas
              </Button>
              <Button
                disabled={selected.length === 0 || missingCategory || mutation.isPending}
                onClick={() => { setError(null); mutation.mutate() }}
              >
                {mutation.isPending ? "Importando..." : `Importar ${selected.length}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
