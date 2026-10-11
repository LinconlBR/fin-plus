import zod from "zod";
import { toDateString } from "@/lib/reports";

// Compara datas como texto "YYYY-MM-DD" (a ordem alfabética é a ordem do calendário).
// new Date("2026-10-10") seria meia-noite em UTC, sempre anterior a "agora", e
// recusaria até um prazo de hoje.
// No servidor (UTC) aceitamos também "ontem": à noite no Brasil o "hoje" do
// servidor já é amanhã e recusaria o prazo de hoje. No navegador a regra é estrita.
function earliestAllowedDeadline(): string {
  const date = new Date()
  if (typeof window === "undefined") date.setDate(date.getDate() - 1)
  return toDateString(date)
}

export const goalSchema = zod.object({
  name: zod.string().min(1).max(100),
  target_amount: zod.number().positive(),
  deadline: zod.union([zod.string(), zod.undefined()]),
}).refine(
  (data) => !data.deadline || data.deadline >= earliestAllowedDeadline(),
  {
    message: "O prazo não pode ser uma data no passado",
    path: ["deadline"],
  }
)

