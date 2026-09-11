"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card" 
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldError,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"
import { signup } from "@/lib/actions/auth"



// TanStack Form é um gerenciador de estado de formulário moderno, com validação integrada e suporte a schemas Zod. Ele é usado aqui para validar os campos de transação antes de enviar para a Server Action.
import { useMutation } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { signupSchema } from "@/lib/schema/signupSchema"





export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  
  const mutation = useMutation({
    // mutationFn é a função que faz o trabalho de verdade. Repare que ela
    // recebe um FormData — vamos montar esse FormData a partir dos valores
    // do formulário, porque é isso que sua Server Action createTransaction
    // já espera receber (mesmo padrão que login/signup usam).
    mutationFn: async (formData: FormData) => {
      const result = await signup(formData)

          if (result?.error) {
        throw new Error(result.error)
      }

      return result
    },
    // onSuccess roda automaticamente    formData.set("confirm_password", value.confirm_password)    formData.set("confirm_password", value.confirm_password) quando mutationFn termina sem erro.
    onSuccess: () => {  
      
    },
  })

  const form = useForm({
    defaultValues: {
          email: "",
          password: "",
          name: "",
          confirm_password: "",
      },
    
  
    // TanStack Form valida usando o schema Zod diretamente — mesmo schema que
    // você já escreveu, sem precisar de nenhum "resolver" intermediário
    // (diferente do react-hook-form, que precisava do zodResolver).
    validators: {
      onSubmit: signupSchema,
    },
    onSubmit: async ({ value }) => {
      // Aqui é onde "traduzimos" os valores do formulário (um objeto comum)
      // pro formato FormData que a Server Action espera. Isso existe porque
      // createTransaction foi escrita pra ser chamada também via
      // <form action={...}>, que sempre entrega FormData.
      const formData = new FormData()
      formData.set("email", value.email)
      formData.set("password", value.password)
      formData.set("name", value.name)
      formData.set("confirm_password", value.confirm_password)

      // Dispara a mutation com o FormData montado. mutateAsync (em vez de
      // mutate) retorna uma Promise, o que permite usar await aqui dentro.
      await mutation.mutateAsync(formData)
    },
  })

  //const [state, formAction] = useActionState<authState, FormData>(signup, { error: null })
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">

          <form className="flex flex-1 flex-col gap-4 p-6 md:p-10"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Crie sua conta Fin+</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Comece a organizar seu dinheiro de um jeito simples e consciente
                </p>
              </div>
               <form.Field
                  name="name"
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Nome Completo</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Ex: Francisgleison Filho"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
              <form.Field
                  name="email"
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>E-mail</FieldLabel>
                        <Input
                          type="email"
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Ex: example@domain.com"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
                <form.Field
                  name="password"
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Ex: ********"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                </form.Field>
                <form.Field
                  name="confirm_password" 
                >
                  {(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Confirme sua senha</FieldLabel>  

                        <Input
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur} 

                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Ex: ********"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
              </form.Field>
              <Field>
                <FieldDescription>
                  {mutation.isError && (
                    <span className="text-rose-600">
                      {mutation.error instanceof Error
                        ? mutation.error.message
                        : "Ocorreu um erro ao criar a conta."}
                    </span>
                  )}
                </FieldDescription>
                <Button
                  type="submit"
                  disabled={mutation.isPending}
                  className="mt-6 w-full"
                >
                  {mutation.isPending ? "Criando conta..." : "Criar conta"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Ou cadastre-se com
              </FieldSeparator>
              <Field className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Cadastrar com Apple</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Cadastrar com Google</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Cadastrar com Meta</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Já tem uma conta? <Link href="/auth/login">Entre agora</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
              alt="Visão organizada das finanças pessoais no Fin+"
              fill
              priority
              unoptimized
              sizes="(max-width: 768px) 0px, 50vw"
              className="object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Ao continuar, você concorda com os <a href="#">Termos de uso</a>{" "}
        e a <a href="#">Política de privacidade</a> do Fin+.
      </FieldDescription>
    </div>
  )
}
