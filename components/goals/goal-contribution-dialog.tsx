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


import { goalContributionFormSchema } from "@/lib/schema/goal-contribution-form"
import { createGoalContribution } from "@/lib/actions/goal-contributions"


export function GoalContributionDialog({
  goal_id,
  trigger,
}: {
  goal_id?: string
  trigger?: React.ReactElement
}) {
    const [open, setOpen] = useState(false)

    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
            if (!goal_id) {
                throw new Error(" O id do objetivo é obrigatório para criar uma contribuição.")
            }
            await createGoalContribution( formData)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["goals"] })
            setOpen(false)
        },
    })

    const form = useForm({
        defaultValues: {
            amount: 0,
            date: new Date().toISOString().split("T")[0],
        },
        validators: { 
            onSubmit:goalContributionFormSchema     
        },
        onSubmit: async ({ value }) => {
            const formData = new FormData()
            // goal_id! funciona como um "assertion" para garantir que goal_id não é undefined
            formData.append("goal_id", goal_id!)
            formData.append("amount", value.amount.toString())
            formData.append("date", value.date)

            await mutation.mutateAsync(formData)
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger 
                render={
                    trigger ?? 
                    <Button className="ml-auto w-fit bg-primary text-primary-foreground hover:bg-primary/90">
                    + Adicionar valor
                    </Button>
                } 
            />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Contribuição</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                >
                    <FieldGroup>    
                        {/* Campo: amount */}
                        <form.Field name="amount">
                            {(field) => {
                                const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Valor da contribuição</FieldLabel>
                                    <Input
                                    id={field.name}
                                    name={field.name}
                                    type="number"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                    const value = parseFloat(e.target.value)
                                        field.handleChange(isNaN(value) ? 0 : value)
                                    }}
                                    aria-invalid={isInvalid}
                                    placeholder="Ex: 5000"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                                )
                            }}
                        </form.Field>
                        {/* Campo: date */}
                        <form.Field name="date">
                            {(field) => {
                                const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Data da contribuição</FieldLabel>
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
                        : "Adicionar Contribuição"}
                    </Button>
                </form> 
            </DialogContent>
        </Dialog>
    )
}
