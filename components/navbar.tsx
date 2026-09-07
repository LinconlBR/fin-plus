import Link from "next/link";
import { BadgeSwissFranc } from 'lucide-react'; 
import { Button } from "@/components/ui/button";

export default function  Navbar() {
    return (
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/#inicio" className="flex items-center gap-2 text-xl font-bold"> 
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BadgeSwissFranc className="h-5 w-5" />
        </span>
         Fin<span className="relative -ml-2 -top-1 text-primary">+</span>
         </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <Link href="/#inicio">Início</Link>
          <Link href="/#recursos">Recursos</Link>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/#seguranca">Segurança</Link>
        </nav>
        {/* botão do menu móvel */}
        <button className="md:hidden">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className=" gap-2 md:flex">
          <Button variant="link"><Link href="/auth/login">Entrar</Link></Button>
          <Button variant="default"><Link href="/auth/signup">Começar agora</Link></Button>
        </div>
      </header>
    )
}
