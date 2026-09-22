import zod from "zod";

export const goalSchema = zod.object({
  name: zod.string().min(1).max(100),
  target_amount: zod.number().positive(),
  deadline: zod.union([zod.string(), zod.undefined()]), // opcional, lembra da pegadinha
})

