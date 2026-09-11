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


import { transactionSchema } from "@/lib/schema/transactions"
import { createTransaction } from "@/lib/actions/transactions"
import { useCategories } from "@/hooks/use-categories"

export function NewTransactionDialog() {
  const [open, setOpen] = useState(false)

  // Precisamos das categorias reais pra popular o <Select> — mesmo hook que
  // você já escreveu antes.
  const { data: categories } = useCategories()

  // queryClient é o "cache central" do TanStack Query (o mesmo que o
  // QueryClientProvider criou lá no components/providers.tsx). Pegamos uma
  // referência a ele aqui pra poder invalidar o cache depois de criar a
  // transação — é assim que a tabela vai saber que precisa buscar dados novos.
  const queryClient = useQueryClient()

  // useMutation é o "irmão" do useQuery, mas pra operações que MUDAM dados
  // (criar/editar/apagar), em vez de só ler. Diferente do useQuery, ele não
  // roda sozinho — você chama mutate() manualmente, quando quiser disparar.
  const mutation = useMutation({
    // mutationFn é a função que faz o trabalho de verdade. Repare que ela
    // recebe um FormData — vamos montar esse FormData a partir dos valores
    // do formulário, porque é isso que sua Server Action createTransaction
    // já espera receber (mesmo padrão que login/signup usam).
    mutationFn: async (formData: FormData) => {
      await createTransaction(formData)
    },
    // onSuccess roda automaticamente quando mutationFn termina sem erro.
    onSuccess: () => {
      // invalidateQueries diz ao TanStack Query: "os dados dessa queryKey
      // estão desatualizados, busca de novo". A tabela de transações usa
      // queryKey: ["transactions"] (lembra do use-transactions.ts) — então
      // isso faz ela recarregar sozinha, sem você dar refresh na página.
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      form.reset()
      setOpen(false)
    },
  })

  const form = useForm({
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense" as "income" | "expense",
      category_id: "",
      date: new Date().toISOString().split("T")[0],
    },
    // TanStack Form valida usando o schema Zod diretamente — mesmo schema que
    // você já escreveu, sem precisar de nenhum "resolver" intermediário
    // (diferente do react-hook-form, que precisava do zodResolver).
    validators: {
      onSubmit: transactionSchema,
    },
    onSubmit: async ({ value }) => {
      // Aqui é onde "traduzimos" os valores do formulário (um objeto comum)
      // pro formato FormData que a Server Action espera. Isso existe porque
      // createTransaction foi escrita pra ser chamada também via
      // <form action={...}>, que sempre entrega FormData.
      const formData = new FormData()
      formData.set("description", value.description)
      formData.set("amount", String(value.amount))
      formData.set("type", value.type)
      formData.set("category_id", value.category_id)
      formData.set("date", value.date)

      // Dispara a mutation com o FormData montado. mutateAsync (em vez de
      // mutate) retorna uma Promise, o que permite usar await aqui dentro.
      await mutation.mutateAsync(formData)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Nova transação</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <FieldGroup>
            {/* Campo: descrição */}
            <form.Field
              name="description"
            >
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
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            {/* Campo: valor e data lado a lado */}
            <div className="flex gap-4">
              <form.Field
                name="amount"
              >
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
                        // Number(...) porque o <Input type="number"> entrega
                        // string no evento, mas nosso schema espera number.
                        onChange={(e) =>
                          field.handleChange(Number(e.target.value))
                        }
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>

              <form.Field
                name="date"
              >
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
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              </form.Field>
            </div>

            {/* Campo: tipo (receita/despesa) */}
            <form.Field
              name="type"
            >
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
                    </FieldContent>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as "income" | "expense")
                      }
                    >
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Despesa</SelectItem>
                        <SelectItem value="income">Receita</SelectItem>
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>

            {/* Campo: categoria — opções vindas do useCategories() */}
            <form.Field
              name="category_id"
            >
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
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={isInvalid}
                      >
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
          </FieldGroup>

          <Button
            type="submit"
            disabled={mutation.isPending}
            className="mt-6 w-full"
          >
            {mutation.isPending ? "Salvando..." : "Salvar transação"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}