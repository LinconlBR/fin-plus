import { z } from "zod"
import { WIDGET_IDS } from "@/lib/dashboard-layout"

// Valida o layout que o cliente manda para a Server Action: só blocos conhecidos,
// sem repetir nenhum e com o tamanho exato (todos os blocos, na ordem escolhida).
export const dashboardLayoutSchema = z
  .array(
    z.object({
      id: z.enum(WIDGET_IDS),
      visible: z.boolean(),
    })
  )
  .length(WIDGET_IDS.length, "Layout inválido")
  .refine((layout) => new Set(layout.map((widget) => widget.id)).size === layout.length, {
    message: "Layout inválido",
  })
