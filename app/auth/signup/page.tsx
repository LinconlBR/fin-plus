import { SignupForm } from "@/components/auth/signup-form"
import Navbar from "@/components/navbar"

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
    
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
    </main>
  )
}
