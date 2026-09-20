import Link from "next/link"
import { BadgeSwissFranc } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center px-6 py-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BadgeSwissFranc className="h-5 w-5" />
          </span>
          Fin<span className="relative -top-1 -ml-2 text-primary">+</span>
        </Link>
      </header>

      <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
        <div className="w-full max-w-sm md:max-w-4xl">
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
