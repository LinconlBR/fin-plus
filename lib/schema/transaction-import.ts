import { z } from "zod"

export const MAX_IMPORT_ROWS = 500

export const importRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  description: z.string().trim().min(1, "Descrição é obrigatória").max(200, "Descrição muito longa"),
  amount: z.number().positive("Valor deve ser maior que zero").max(1_000_000_000, "Valor muito alto"),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid("Categoria inválida"),
})

export const importPayloadSchema = z
  .array(importRowSchema)
  .min(1, "Nada para importar")
  .max(MAX_IMPORT_ROWS, `Importe no máximo ${MAX_IMPORT_ROWS} transações por vez`)

export type ImportPayloadRow = z.infer<typeof importRowSchema>
