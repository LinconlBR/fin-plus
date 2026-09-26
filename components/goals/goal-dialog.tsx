"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"


import { goalSchema } from "@/lib/schema/goals"
import { createGoal, updateGoal } from "@/lib/actions/goals"


import type { Goal } from "@/hooks/use-goals"

export function GoalDialog({
  goal,
  trigger,
}: {
  goal?: Goal
  trigger?: React.ReactElement
}) {
    const [open, setOpen] = useState(false)

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (goal) {
                await updateGoal(goal.id, formData)
            } else {
                await createGoal(formData)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] })
            setOpen(false)
        },
    })

    const form = useForm({
        defaultValues: {
            name: goal?.name || "",
            target_amount: goal?.target_amount || 0,
            deadline: goal?.deadline || undefined,
        },
         validators: {
              onSubmit: goalSchema,
        },
        onSubmit: async ({ value }) => {
            const formData = new FormData()
            formData.append("name", value.name)
            formData.append("target_amount", value.target_amount.toString())
            if (value.deadline) {
            formData.append("deadline", value.deadline)
            }

            await mutation.mutateAsync(formData)
        },
    })

    

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    trigger ?? 
                    <Button className="ml-auto w-fit bg-primary text-primary-foreground hover:bg-primary/90">
                    + Novo objetivo
                    </Button>
                } 
            />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{goal ? "Editar objetivo" : "Criar objetivo"}</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                >
                    <FieldGroup>    
                        {/* Campo: name */}
                        <form.Field name="name">
                        {(field) => {
                            const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel htmlFor={field.name}>Título do objetivo</FieldLabel>
                                <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={isInvalid}
                                placeholder="Ex: Viagem para a Europa"
                                />
                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                            )
                        }}
                        </form.Field>
                        {/* Campo: target_amount */}
                        <form.Field name="target_amount">
                            {(field) => {
                                const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Valor alvo</FieldLabel>
                                    <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(parseFloat(e.target.value))}
                                    aria-invalid={isInvalid}
                                    placeholder="Ex: 5000"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                                )
                            }}
                        </form.Field>
                        {/* Campo: deadline */}
                        <form.Field name="deadline">
                            {(field) => {
                                const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Prazo</FieldLabel>
                                    <Input
                                    id={field.name}
                                    name={field.name}
                                    type="date"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    aria-invalid={isInvalid}
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                                )
                            }}
                        </form.Field>
                    </FieldGroup>
                    {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}
                    <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full" >
                        {mutation.isPending
                        ? "Salvando..."
                        : goal
                        ? "Salvar alterações"
                        : "Salvar Objetivo"}
                    </Button>
                </form> 
            </DialogContent>
        </Dialog>
    )
}