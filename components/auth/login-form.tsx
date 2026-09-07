"use client"

import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { login , LoginState } from "@/lib/actions/auth"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

  {/* crédito da imagem: https://www.svgrepo.com/svg/512187/finance-illustration */}
const financeIllustration = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200" role="img" aria-label="Pessoa organizando finanças">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#e0f2fe"/>
      <stop offset="100%" stop-color="#dbeafe"/>
    </linearGradient>
    <linearGradient id="card" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#bg)"/>
  <circle cx="905" cy="220" r="92" fill="#bfdbfe" opacity="0.7"/>
  <circle cx="272" cy="174" r="52" fill="#dbeafe" opacity="0.7"/>
  <rect x="140" y="180" width="920" height="780" rx="36" fill="url(#card)" opacity="0.9"/>
  <rect x="206" y="262" width="360" height="210" rx="24" fill="#eff6ff"/>
  <rect x="248" y="318" width="128" height="18" rx="9" fill="#93c5fd"/>
  <rect x="248" y="354" width="220" height="16" rx="8" fill="#cbd5e1"/>
  <rect x="248" y="390" width="170" height="16" rx="8" fill="#cbd5e1"/>
  <path d="M246 420 C320 342, 390 292, 480 318 L480 420 Z" fill="#7dd3fc" opacity="0.8"/>
  <rect x="610" y="265" width="320" height="200" rx="24" fill="#f8fafc" stroke="#dbeafe" stroke-width="4"/>
  <path d="M650 420 L710 370 L770 392 L845 328 L900 358 L900 430 L650 430 Z" fill="#93c5fd" opacity="0.9"/>
  <path d="M650 420 L710 370 L770 392 L845 328 L900 358" fill="none" stroke="#2563eb" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="238" y="560" width="742" height="248" rx="26" fill="#f8fafc" stroke="#dbeafe" stroke-width="4"/>
  <rect x="282" y="610" width="220" height="134" rx="18" fill="#2563eb"/>
  <path d="M322 670 L360 628 L410 693 L468 620" fill="none" stroke="#dbeafe" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="546" y="612" width="180" height="20" rx="10" fill="#cbd5e1"/>
  <rect x="546" y="656" width="250" height="18" rx="9" fill="#e2e8f0"/>
  <rect x="546" y="694" width="210" height="18" rx="9" fill="#e2e8f0"/>
  <circle cx="860" cy="430" r="48" fill="#fef3c7"/>
  <path d="M844 430 L856 446 L882 406" fill="none" stroke="#f59e0b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="translate(470 118)">
    <rect x="0" y="0" width="220" height="260" rx="140" fill="#f0fdf4"/>
    <circle cx="110" cy="82" r="52" fill="#f6c7ae"/>
    <path d="M66 222 C78 170, 144 165, 156 222 L156 250 L66 250 Z" fill="#2563eb"/>
    <path d="M56 108 C58 44, 168 50, 176 100 L164 115 C150 80, 92 74, 70 120 Z" fill="#1e293b"/>
    <rect x="40" y="128" width="142" height="16" rx="8" fill="#dbeafe"/>
    <rect x="90" y="150" width="88" height="12" rx="6" fill="#dbeafe"/>
  </g>
  <g transform="translate(266 132)">
    <rect x="0" y="0" width="180" height="120" rx="18" fill="#ffffff"/>
    <path d="M32 78 L74 48 L116 70 L154 40" fill="none" stroke="#22c55e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="32" cy="78" r="10" fill="#22c55e"/>
    <circle cx="74" cy="48" r="10" fill="#22c55e"/>
    <circle cx="116" cy="70" r="10" fill="#22c55e"/>
    <circle cx="154" cy="40" r="10" fill="#22c55e"/>
  </g>
</svg>
`)}`

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, formAction] = useActionState<LoginState, FormData>(login, { error: null })

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form action={formAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Que bom ter você de volta</h1>
                <p className="text-balance text-muted-foreground">
                  Entre na sua conta Fin+ e retome o controle das suas finanças
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                  >
                    Esqueceu sua senha?
                  </a>
                </div>
                <Input 
                  name="password" 
                  id="password" 
                  type="password" 
                  required 
                />
              </Field>
                  {state?.error && (
                    <p className="text-sm text-destructive">{state.error}</p>
                  )}
              <Field>
                <Button type="submit">Entrar na minha conta</Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Ou entre com
              </FieldSeparator>
              <Field className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Entrar com Apple</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Entrar com Google</span>
                </Button>
                <Button variant="outline" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Entrar com Meta</span>
                </Button>
              </Field>
              <FieldDescription className="text-center">
                Ainda não tem uma conta? <Link href="/auth/signup">Crie seu cadastro</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src={financeIllustration}
              alt="Pessoa organizando suas finanças no Fin+"
              fill
              sizes="(max-width: 768px) 0px, 50vw"
              className="object-cover dark:brightness-[0.2] dark:grayscale"
              priority
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
