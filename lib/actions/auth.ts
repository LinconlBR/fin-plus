"use server"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// SERVER ACTIONS: essa diretiva "use server" no topo do arquivo diz ao Next.js que
// TODA função exportada aqui roda exclusivamente no servidor — nunca no navegador.
// É por isso que <form action={login}> funciona sem fetch() manual: o Next.js cria,
// no build, um endpoint interno pra cada função e cuida do transporte de rede sozinho.

export type authState = {
  error: string | null
}

export async function login(prevState: authState, formData: FormData) {
  // formData.get() pode retornar null se o campo não existir no form (por isso o
  // atributo name="email" no <Input> é obrigatório — sem ele, isso aqui vira sempre
  // null). O ?? "" garante um fallback seguro em vez de deixar passar null adiante.
  const email = formData.get("email")?.toString() ?? ""
  const password = formData.get("password")?.toString() ?? ""

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
  redirect("/dashboard")
}

export async function signup(prevState: authState,formData: FormData) {
  const name = formData.get("name")?.toString() ?? ""
  const email = formData.get("email")?.toString() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
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
    return { error: error.message }
  }

  // Redireciona pro login (não pro dashboard) porque o Supabase exige confirmação de
  // e-mail antes da sessão ser considerada válida — o usuário ainda não está
  // "logado de verdade" só por ter se cadastrado.
  redirect("/auth/login")
}