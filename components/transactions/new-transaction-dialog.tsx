"use client"


import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { transactionSchema } from "@/lib/schema/transactions"
import { z } from "zod"

type TransactionFormValues = z.infer<typeof transactionSchema>



export function NewTransactionDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm<TransactionFormValues>({
  resolver: zodResolver(transactionSchema),
  defaultValues: {
    description: "",
    amount: 0,
    type: "expense",
    category_id: "",
    date: new Date().toISOString().split("T")[0],
  },
})

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button>+ Nova transação</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova transação</DialogTitle>
        </DialogHeader>
        {/* formulário vem aqui na próxima parte */}
      </DialogContent>
    </Dialog>
  )
}