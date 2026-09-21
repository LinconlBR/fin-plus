"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { deleteCategory } from "@/lib/actions/categories"

export function DeleteCategoryButton({ id }: { id: string }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
  return (
     <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apagar Categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. A categoria será removida
            permanentemente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {/* onClick aqui dispara a mutation ANTES do AlertDialogAction fechar
              o dialog — os dois acontecem, sem conflito, porque um é o clique
              em si e o outro é o fechamento visual do modal. */}
          <AlertDialogAction variant="destructive-solid" onClick={() => mutation.mutate()}>
            Apagar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}