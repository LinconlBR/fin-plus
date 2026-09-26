import zod from "zod";

export const goalSchema = zod.object({
  name: zod.string().min(1).max(100),
  target_amount: zod.number().positive(),
  deadline: zod.union([zod.string(), zod.undefined()]),
}).refine(
  (data) => !data.deadline || new Date(data.deadline) >= new Date(),
  {
    message: "O prazo não pode ser uma data no passado",
    path: ["deadline"],
  }
)

