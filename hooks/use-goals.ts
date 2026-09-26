"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"


export type Goal = {
    id: string;
    name: string;
    target_amount: number;
    created_at: string | null;
    deadline: string | null;
    user_id: string;
}

type GoalRow = {
  id: string
  name: string
  target_amount: string
  created_at: string | null
  deadline: string | null
  user_id: string
}

async function fetchGoals(): Promise<Goal[]> {
    const supabase = createClient()
    const { data, error } = await supabase 
    .from("goals")
    .select("*")

    if (error) {
        throw new Error(error.message)
    }
    if (!data) {
        throw new Error("No data returned from goals query")
    }

    return (data as GoalRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        target_amount: parseFloat(row.target_amount),
        created_at: row.created_at,
        deadline: row.deadline,
        user_id: row.user_id,
    }))
    
}

export type GoalWithProgress = Goal & { progress: number; current_amount: number }

 export async function fetchGoalsWithProgress(): Promise<GoalWithProgress[]> {
    const supabase = createClient()
    const goals = await fetchGoals()

    const {data: contributions} = await supabase
    .from("goal_contributions")
    .select("goal_id, amount")
    .throwOnError()

    return goals.map((goal) => {
        const totalContributions = (contributions ?? [])
        .filter((contribution) => contribution.goal_id === goal.id)
        .reduce((sum, contribution) => sum + Number(contribution.amount), 0)

        const progress = totalContributions / goal.target_amount

        return {
            ...goal,
            current_amount: totalContributions,
            progress,
        }
    })


}
export function useGoals() {
    return useQuery({
        queryKey: ["goals"],
        queryFn: fetchGoalsWithProgress,
    })
}