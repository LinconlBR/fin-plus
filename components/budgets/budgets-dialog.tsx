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
import { Switch } from "@/components/ui/switch"
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { budgetSchema } from "@/lib/schema/budgets"
import { createBudget, updateBudget } from "@/lib/actions/budgets"
import { useCategories } from "@/hooks/use-categories"

import type { BudgetWithSpent } from "@/hooks/use-budgets"

export function BudgetsDialog({
  budget,
  trigger,
}: {
  budget?: BudgetWithSpent
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const { data: categories } = useCategories()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (budget) {
        await updateBudget(budget.id, formData)
      } else {
        await createBudget(formData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] })
      form.reset()
      setOpen(false)
    },
  })

  const form = useForm({
    defaultValues: {
      category_id: budget?.category_id ?? "",
      target_amount: budget?.targetAmount ?? 0,
      period: budget?.period ?? ("monthly" as "weekly" | "monthly"),
      // is_recurring já nasce como boolean de verdade aqui no estado do
      // formulário — só vira texto ("true"/"false") na hora de montar o
      // FormData pro Server Action, porque FormData só entende strings.
      is_recurring: budget?.isRecurring ?? true,
      start_date: budget?.startDate ?? new Date().toISOString().split("T")[0],
      end_date: budget?.endDate ?? undefined,
    },
    validators: {
      onSubmit: budgetSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      formData.set("category_id", value.category_id)
      formData.set("target_amount", String(value.target_amount))
      formData.set("period", value.period)
      formData.set("is_recurring", String(value.is_recurring))
      formData.set("start_date", value.start_date)
      // Só manda end_date se ele tiver valor — pra orçamento recorrente,
      // isso deixa o campo de fora do FormData (equivalente a "ausente",
      // que é o que o .nullish() do schema espera).
      if (value.end_date) {
        formData.set("end_date", value.end_date)
      }

      await mutation.mutateAsync(formData)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>+ Novo orçamento</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* Categoria */}
            <form.Field name="category_id">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Categoria</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) => {
                        if (value !== null) field.handleChange(value)
                      }}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue placeholder="Selecione uma categoria">
                          {(value: string) =>
                            categories?.find((c) => c.id === value)?.name
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            {/* Valor limite e período, lado a lado */}
            <div className="flex gap-4">
              <form.Field name="target_amount">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="flex-1">
                      <FieldLabel htmlFor={field.name}>Valor limite</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field name="period">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="flex-1">
                      <FieldLabel htmlFor={field.name}>Período</FieldLabel>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) =>
                          field.handleChange(v as "weekly" | "monthly")
                        }
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue>
                            {(value: string) =>
                              value === "weekly" ? "Semanal" : "Mensal"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            {/* Switch: recorrente ou único */}
            <form.Field name="is_recurring">
              {(field) => (
                <Field data-invalid={false} orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      Orçamento recorrente
                    </FieldLabel>
                  </FieldContent>
                  {/* Switch usa checked/onCheckedChange, não value/onChange
                      como Input — é a API própria desse componente (Base UI). */}
                  <Switch
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>

            {/* Data de início */}
            <form.Field name="start_date">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Data de início</FieldLabel>
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

            {/* Data final — só aparece quando NÃO é recorrente.
                form.Subscribe "escuta" um pedaço específico do estado do
                formulário (aqui, só o valor de is_recurring) e re-renderiza
                só esse trecho quando ele mudar — sem re-renderizar o form
                inteiro a cada tecla digitada em outro campo. */}
            <form.Subscribe selector={(state) => state.values.is_recurring}>
              {(isRecurring) =>
                !isRecurring && (
                  <form.Field name="end_date">
                    {(field) => {
                      const isInvalid =
                        field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Data final</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            type="date"
                            value={field.state.value ?? ""}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  </form.Field>
                )
              }
            </form.Subscribe>
          </FieldGroup>

          {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

          <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full">
            {mutation.isPending
              ? "Salvando..."
              : budget
              ? "Salvar alterações"
              : "Salvar orçamento"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}