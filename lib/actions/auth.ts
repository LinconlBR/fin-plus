"use server"

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const email = formData.get("email")?.toString() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const supabase = await createClient() 

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }
  
  
}

export async function signup(formData: FormData) {
  const name = formData.get("name")?.toString() ?? ""
  const email = formData.get("email")?.toString() ?? ""
  const password = formData.get("password")?.toString() ?? ""
  const supabase = await createClient() 

  const { error } = await supabase.auth.signUp({
    email,
    password,
  options: {
    data: {
      name,
    },
  },
  })

  if (error) {
    throw new Error(error.message)
  }
  
  
}