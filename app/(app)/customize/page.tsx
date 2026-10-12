import { redirect } from "next/navigation"

// "Personalizar" é só o agrupador do menu: não tem conteúdo próprio, então quem chega
// aqui (por exemplo pelo breadcrumb) vai direto para a primeira opção.
export default function Customize() {
  redirect("/customize/dashboard")
}
