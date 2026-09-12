// Factory do cliente Supabase executado no navegador, usando as variáveis públicas da aplicação.
import { createBrowserClient } from '@supabase/ssr'

 
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    
  )
}
