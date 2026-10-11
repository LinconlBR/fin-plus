import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(60, "Nome muito longo"),
  type: z.enum(["income", "expense"], "Tipo inválido"),
  // Nome de um ícone do lucide-react (ex.: "UtensilsCrossed"); o app cai em
  // um ícone padrão se o nome não estiver na lista curada.
  icon: z
    .string()
    .min(1, "Ícone é obrigatório")
    .regex(/^[A-Za-z][A-Za-z0-9]{0,39}$/, "Ícone inválido"),
  color: z
    .string()
    .min(1, "Cor é obrigatória")
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida"),
})
