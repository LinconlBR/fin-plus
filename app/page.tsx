import Link from "next/link";
import Navbar from "@/components/navbar";


export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <section id="inicio" className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:py-28">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Seu dinheiro, no controle</p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">Uma vida financeira mais <span className="text-primary">leve e consciente.</span></h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">Acompanhe seus gastos, organize seu orçamento e alcance seus objetivos sem complicação. O Fin+ transforma números em decisões melhores.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/auth/signup" className="rounded-full bg-primary px-6 py-3 text-center text-sm font-semibold text-primary-foreground">Criar minha conta grátis →</Link>
          <Link href="#recursos" className="rounded-full border border-border px-6 py-3 text-center text-sm font-semibold">Conhecer o Fin+</Link></div>
          <p className="mt-5 text-xs text-muted-foreground">Grátis para começar · Sem cartão de crédito</p>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 rounded-[3rem] bg-primary/10 blur-3xl" />
          <div className="relative rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Saldo disponível</p>
                <p className="mt-1 text-3xl font-bold">R$ 8.420,00</p>
                </div>
                <span className="rounded-xl bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">+12,5%</span>
                </div>
                <div className="mt-8 flex h-32 items-end gap-2 border-b border-border">{[35,48,42,65,58,78,92,72,86,100,88,100].map((h, i) => <div key={i} className="flex-1 rounded-t bg-primary/20" style={{ height: `${h}%` }}><div className="h-1/2 rounded-t bg-primary" /></div>)}</div><div className="mt-5 flex justify-between"><b className="text-sm">Resumo mensal</b><span className="text-xs text-muted-foreground">Junho, 2024</span></div><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>🔵 Entradas</span><b className="text-emerald-600">+ R$ 5.200</b></div><div className="flex justify-between"><span>🟠 Despesas</span><b>- R$ 2.180</b></div></div></div></div>
      </section>

      <section id="recursos" className="border-y border-border bg-muted/30 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold text-primary">
              Tudo em um só lugar
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Clareza para fazer seu dinheiro render.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Com o Fin+, você tem total controle sobre suas finanças.
            </p>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 text-2xl">
                ◔
              </div>
              <h3 className="font-semibold">
                Visão completa
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Veja para onde seu dinheiro está indo com gráficos simples e intuitivos.
              </p>
            </article>
            <article id="como-funciona" className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 text-2xl">✓</div>
              <h3 className="font-semibold">Metas possíveis</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Crie objetivos e acompanhe seu progresso até realizar cada um deles.
              </p>
            </article>
            <article id="seguranca" className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-5 text-2xl">⌁</div>
              <h3 className="font-semibold">Dados protegidos</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sua privacidade vem primeiro. Seus dados são sempre seus e estão seguros.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section id="comecar" className="px-6 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pronto para assumir o controle?</h2>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          Comece hoje a construir uma relação mais saudável com o seu dinheiro.
        </p>
        <Link href="/auth/signup" className="mt-7 inline-block rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground">
          Começar gratuitamente →
        </Link>
      </section>
      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        © 2024 Fin+. Feito para uma vida financeira mais tranquila.
      </footer>
    </main>
  );
}
