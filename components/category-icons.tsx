import {
  UtensilsCrossed, Coffee, Pizza, Beer, ShoppingCart,
  Car, Bus, Bike, Train, Fuel, Plane,
  Home, Building2, Key, Lightbulb, Wrench, Wifi,
  HeartPulse, Pill, Stethoscope, Dumbbell,
  GraduationCap, BookOpen, School,
  Gamepad2, Film, Music, Ticket, Tv, PartyPopper,
  ShoppingBag, Gift, Shirt,
  Baby, PawPrint, Users,
  Briefcase, Wallet, Banknote, TrendingUp, PiggyBank, HandCoins, Landmark,
  CreditCard, Receipt, Tag, MoreHorizontal,
  type LucideIcon,
} from "lucide-react"

// Lista curada de ícones relevantes ao domínio do app — importados nomeados
// (não `import *`), pra manter o tree-shaking funcionando e o bundle pequeno.
const iconMap: Record<string, LucideIcon> = {
  UtensilsCrossed, Coffee, Pizza, Beer, ShoppingCart,
  Car, Bus, Bike, Train, Fuel, Plane,
  Home, Building2, Key, Lightbulb, Wrench, Wifi,
  HeartPulse, Pill, Stethoscope, Dumbbell,
  GraduationCap, BookOpen, School,
  Gamepad2, Film, Music, Ticket, Tv, PartyPopper,
  ShoppingBag, Gift, Shirt,
  Baby, PawPrint, Users,
  Briefcase, Wallet, Banknote, TrendingUp, PiggyBank, HandCoins, Landmark,
  CreditCard, Receipt, Tag, MoreHorizontal,
}

export function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  // Fallback: se o nome do ícone não existir no mapa (ou vier vazio), usa Tag
  // como ícone genérico — evita quebrar caso uma categoria antiga tenha um
  // nome de ícone inválido/desatualizado.
  const Icon = iconMap[icon] ?? Tag

  return (
    <div
      className="flex size-8 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon className="size-4" style={{ color }} />
    </div>
  )
}