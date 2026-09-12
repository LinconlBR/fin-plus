// Server Actions responsáveis por autenticar, cadastrar e desconectar usuários no Supabase.
"use server"

import { createClient } from '@/lib/supabase/server'
import { signupSchema } from '@/lib/schema/signupSchema'
import { redirect } from 'next/navigation'
import { loginSchema } from '../schema/loginSchema'


// ATENÇÃO: Server Actions não podem ser chamadas de dentro de Client Components. Se você tentar fazer isso, vai dar erro de compilação. Server Actions só podem ser chamadas de:
// 1. <form action={serverAction}> (como login/signup fazem)
// 2. Outras Server Actions (uma Server Action pode chamar outra, sem problemas)
// 3. API Routes (uma API Route pode chamar uma Server Action, sem problemas)


export async function login( formData: FormData) {
  // Valida os dados do formulário usando o schema Zod. Se os dados forem inválidos, retorna um objeto com a mensagem de erro.
  const parsed = loginSchema.safeParse({
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  })
  // Se os dados forem inválidos, retorna um objeto com a mensagem de erro.
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }
  // Se os dados forem válidos, extrai o email e a senha do objeto validado.
  const { email, password } = parsed.data

  // ATENÇÃO AO AWAIT: createClient() é uma função async, ou seja, ela SEMPRE retorna
  // uma Promise, nunca o valor direto. Esquecer o `await` aqui faz `supabase` virar
  // uma Promise<SupabaseClient> em vez do client de verdade — e Promise não tem
  // propriedade `.auth`, o que quebra a linha de baixo (foi o primeiro bug que
  // encontramos: "Property 'auth' does not exist on type Promise<...>").
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // redirect() não é um return normal: por baixo dos panos ele lança uma exceção
  // especial que o Next.js intercepta para navegar o usuário. Por isso qualquer
  // código escrito DEPOIS dessa linha nunca executaria — ele precisa vir depois do
  // `if (error)`, fora dele, pra só rodar quando o login realmente deu certo.

}

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    confirm_password: formData.get("confirm_password")?.toString() ?? "",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const { name, email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // CHAVE IMPORTANTE: "full_name" aqui precisa bater EXATAMENTE com a chave que
      // o trigger handle_new_user() lê no banco via
      // NEW.raw_user_meta_data->>'full_name'. Usar qualquer outro nome (ex: "name")
      // não dá erro nenhum — só insere full_name como NULL silenciosamente na tabela
      // profiles. Foi um bug real que passou despercebido até conferirmos o banco.
      data: {
        full_name: name,
      },
    },
  })

  if (error) {
    if (error.status === 429 || error.message.toLowerCase().includes("rate limit")) {
      return {
        error: "Limite de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.",
      }
    }

    return { error: error.message }
  }

  if (!data.user?.identities?.length) {
    return { error: "Este e-mail já está cadastrado." }
  }

  // Redireciona pro login (não pro dashboard) porque o Supabase exige confirmação de
  // e-mail antes da sessão ser considerada válida — o usuário ainda não está
  // "logado de verdade" só por ter se cadastrado.

}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}