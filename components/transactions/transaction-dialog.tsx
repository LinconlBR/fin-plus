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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { transactionSchema } from "@/lib/schema/transactions"
import { createTransaction, updateTransaction } from "@/lib/actions/transactions"
import { useCategories } from "@/hooks/use-categories"

import type { Transaction } from "@/hooks/use-transactions"

export function TransactionDialog({
  transaction,
  trigger,
}: {
  transaction?: Transaction
  trigger?: React.ReactElement
}) {
  const [open, setOpen] = useState(false)

  const { data: categories } = useCategories()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (transaction) {
        await updateTransaction(transaction.id, formData)
      } else {
        await createTransaction(formData)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      form.reset()
      setOpen(false)
    },
  })

  const form = useForm({
    defaultValues: {
      description: transaction?.title ?? "",
      amount: transaction?.amount ?? 0,
      category_id: transaction?.category_id ?? "",
      date: transaction?.createdAt ?? new Date().toISOString().split("T")[0],
    },
    validators: {
      onSubmit: transactionSchema,
    },
    onSubmit: async ({ value }) => {
      const formData = new FormData()
      formData.set("description", value.description)
      formData.set("amount", String(value.amount))
      formData.set("category_id", value.category_id)
      formData.set("date", value.date)

      await mutation.mutateAsync(formData)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? 
        <Button className="ml-auto w-fit bg-primary text-primary-foreground hover:bg-primary/90">
          + Nova transação
        </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? "Editar transação" : "Nova transação"}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* Campo: descrição */}
            <form.Field name="description">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      placeholder="Ex: Supermercado"
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                )
              }}
            </form.Field>

            {/* Campo: valor e data lado a lado */}
            <div className="flex gap-4">
              <form.Field name="amount">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="flex-1">
                      <FieldLabel htmlFor={field.name}>Valor</FieldLabel>
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

              <form.Field name="date">
                {(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid} className="flex-1">
                      <FieldLabel htmlFor={field.name}>Data</FieldLabel>
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
            </div>

            {/* Campo: categoria — o tipo (receita/despesa) é derivado dela
                automaticamente na Server Action, não é mais perguntado aqui. */}
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
                          {(value: string) => categories?.find((c) => c.id === value)?.name}
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
          </FieldGroup>

          {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}

          <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full">
            {mutation.isPending
              ? "Salvando..."
              : transaction
              ? "Salvar alterações"
              : "Salvar transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}