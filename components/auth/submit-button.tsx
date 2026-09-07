import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"

export default function SubmitButton() {

  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Entrando..." : "Entrar na minha conta"}
    </Button>
  )
}