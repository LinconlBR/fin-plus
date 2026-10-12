// Desenha o PDF de transações. Roda no servidor (Route Handler).
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

import { formatCurrency, formatDate } from "@/lib/format"
import { summarizeTransactions, type ExportTransaction } from "@/lib/transaction-export"

export function buildTransactionsPdf(
  transactions: ExportTransaction[],
  range: { from: string | null; to: string | null }
): ArrayBuffer {
  const doc = new jsPDF({ unit: "pt", format: "a4" })
  const margin = 40

  doc.setFontSize(18)
  doc.text("Fin+ — Transações", margin, 50)

  const period =
    range.from || range.to
      ? `Período: ${range.from ? formatDate(range.from) : "início"} a ${range.to ? formatDate(range.to) : "hoje"}`
      : "Período: todas as transações"
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(period, margin, 68)

  const { income, expense, balance } = summarizeTransactions(transactions)
  doc.text(
    `Receitas: ${formatCurrency(income)}   Despesas: ${formatCurrency(expense)}   Saldo: ${formatCurrency(balance)}`,
    margin,
    84
  )
  doc.setTextColor(0)

  autoTable(doc, {
    startY: 100,
    margin: { left: margin, right: margin },
    head: [["Data", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: transactions.map((t) => [
      formatDate(t.date),
      t.description,
      t.category,
      t.type === "income" ? "Receita" : "Despesa",
      formatCurrency(t.amount),
    ]),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: { 4: { halign: "right" } },
    // Rodapé com número de página, desenhado a cada página.
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(120)
      doc.text(`Página ${doc.getNumberOfPages()}`, margin, pageHeight - 20)
      doc.setTextColor(0)
    },
  })

  return doc.output("arraybuffer")
}
