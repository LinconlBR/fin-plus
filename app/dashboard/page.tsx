import { createClient } from "@/lib/supabase/server"

export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase
     .from("profiles")
     .select("*")
     .eq("id", user?.id)
     .single()

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Bem-vindo ao seu painel de controle , <span className="font-bold">{profile?.full_name}</span>!
      </p>
    </div>
  )
}