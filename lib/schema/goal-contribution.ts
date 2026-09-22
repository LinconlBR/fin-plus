import zod from "zod";

export const goalContributionSchema = zod.object({
  goal_id: zod.string().uuid(),
  amount: zod.number().positive(),
  date: zod.string(),
})