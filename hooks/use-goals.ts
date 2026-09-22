"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"


export type Goal = {
    id: string;
    name: string;
    target_amount: number;
    deadline: string | null;
    user_id: string;
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

    return (data as Goal[]).map((row) => ({
        id: row.id,
        name: row.name,
        target_amount: Number(row.target_amount),
        deadline: row.deadline,
        user_id: row.user_id,
    }))
    
}

export type GoalWithProgress = Goal & { progress: number }

 export async function fetchGoalsWithProgress(): Promise<GoalWithProgress> {
    const supabase = createClient()
    const { data, error } = await supabase
    .from("goals")
    .select("*")
    .single()

    if (error) {
        throw new Error(error.message)
    }
    if (!data) {
        throw new Error("No data returned from goal query")
    }

    return {
        id: data.id,
        name: data.name,
        target_amount: Number(data.target_amount),
        deadline: data.deadline,
        user_id: data.user_id,
        progress: 0, // Replace with actual progress calculation
    }

}


export function useGoals() {
    return useQuery({
        queryKey: ["goals"],
        queryFn: fetchGoalsWithProgress,
    })
}