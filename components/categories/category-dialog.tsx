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

import { categorySchema } from "@/lib/schema/categories"
import { createCategory, updateCategory } from "@/lib/actions/categories"

import type { Category } from "@/hooks/use-categories"
import IconsPicker from "./icons-picker"
import ColorsPicker from "./colors-picker"

export function CategoryDialog({
  category,
  trigger, 
}: {
  category?: Category
  trigger?: React.ReactElement
}) {
    const [open, setOpen] = useState(false)   
    
    const queryClient = useQueryClient()
    

    // Mutation para criar ou atualizar a transação
    const mutation = useMutation({
        mutationFn: async (formData: FormData) => {
          if (category) {
            await updateCategory(category.id, formData)
          } else {
            await createCategory(formData)
          }
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["categories"] })
          form.reset()
          setOpen(false)
        },
    })

    // Formulário para criar ou atualizar a categoria
    const form = useForm({
        defaultValues: {
        name: category?.name ?? "",   
        type: category?.type ?? "expense",
        icon: category?.icon ?? "Tag",
        color: category?.color ?? "#64748b",
        },
        validators: {
            onSubmit: categorySchema,
        },
        onSubmit: async ({ value }) => {
        const formData = new FormData()
        formData.set("name", value.name)
        formData.set("type", value.type)
        formData.set("icon", value.icon)
        formData.set("color", value.color)

        await mutation.mutateAsync(formData)
        },
    })
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={trigger ?? 
                <Button >
                    + Nova Categoria
                </Button>} 
            />
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {category ? "Editar categoria" : "Nova categoria"}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
                >
                    <FieldGroup>
                        {/* Campo: titulo */}
                        <form.Field name="name">
                        {(field) => {
                            const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel htmlFor={field.name}>Titulo</FieldLabel>
                                <Input
                                id={field.name}
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                aria-invalid={isInvalid}
                                placeholder="Ex: Lazer, Supermercado, Salário"
                                />
                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                            )
                        }}
                        </form.Field>

                        {/* Campo: tipo */}
                        <form.Field name="type">
                        {(field) => {
                            const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel htmlFor={field.name}>Tipo</FieldLabel>
                                <Select
                                    id={field.name}
                                    name={field.name}
                                    aria-invalid={isInvalid}
                                    onValueChange={(value) => {
                                    if (value !== null) field.handleChange(value)
                                    }}
                                    value={field.state.value}
                                >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="expense">Despesa</SelectItem>
                                    <SelectItem value="income">Receita</SelectItem>
                                </SelectContent>
                                </Select>
                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                            )
                        }}
                        </form.Field>

                        {/* Campo: icone */}
                        <form.Field name="icon">
                        {(field) => {
                            const isInvalid =
                            field.state.meta.isTouched && !field.state.meta.isValid
                            return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel htmlFor={field.name}>Ícone</FieldLabel>
                                    <IconsPicker 
                                        value={field.state.value}
                                        onChange={(value) => field.handleChange(value)} 
                                    />
                                {isInvalid && <FieldError errors={field.state.meta.errors} />}
                            </Field>
                            )
                        }}
                        </form.Field>

                        {/* Campo: color */}
                        <form.Field name="color">
                            {(field) => {
                                const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid
                                return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Cores</FieldLabel>
                                        <ColorsPicker 
                                            value={field.state.value}
                                            onChange={(value) => field.handleChange(value)}  
                                        />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                                )
                            }}
                        </form.Field>
                    </FieldGroup>
                    {mutation.isError && 
                        <FieldError>
                            {mutation.error.message}
                        </FieldError>
                    }
                    <Button type="submit" disabled={mutation.isPending} className="mt-6 w-full">
                        {mutation.isPending
                            ? "Salvando..."
                            : category
                            ? "Salvar alterações"
                            : "Salvar categoria"
                        }
                    </Button>
                </form>
            </DialogContent>
    </Dialog>
    )
}

    
