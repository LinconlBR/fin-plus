import { requireUser } from "@/lib/auth"
import { ProfileForm } from "@/components/settings/profile-form"
import { PasswordForm } from "@/components/settings/password-form"
import { DeleteAccount } from "@/components/settings/delete-account"

export default async function SettingsPage() {
  const { supabase, user } = await requireUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  // Quem entra só com Google/Facebook não tem senha para trocar.
  const providers: string[] = user.app_metadata?.providers ?? []
  const hasPassword = providers.includes("email")

  return (
    <>
      <div className="relative flex items-center justify-center border-b bg-background px-6 py-5 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Conta
        </h1>
      </div>
      <div className="mx-auto w-full max-w-2xl space-y-6 p-6 md:p-8">
        <ProfileForm fullName={profile?.full_name ?? ""} email={user.email ?? ""} />
        <PasswordForm hasPassword={hasPassword} />
        <DeleteAccount />
      </div>
    </>
  )
}
