"use client"

import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export default function SubmitButton({ tipo}: { tipo: "login" | "signup" }) {

  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ?

      // se esta pendente , analise as props para decidir o texto do botão
      (tipo === "login" ? "Entrando..." : "Criando conta...") 

      // se não esta pendente, analise as props para decidir o texto do botão
      : (tipo === "signup" ? "Criar minha conta" : "Entrar na minha conta") }
    </Button>
  )
}