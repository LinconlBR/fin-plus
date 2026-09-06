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