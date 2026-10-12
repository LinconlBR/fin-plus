// Dicionário de estabelecimentos comuns (Espanha e Brasil) → nomes de categoria
// que costumam existir. Serve para o primeiro uso, quando ainda não há histórico.
// Só sugere se a pessoa tiver uma categoria do tipo certo com nome parecido.

import type { TransactionType } from "@/lib/transaction-import"

export type DictionaryEntry = {
  type: TransactionType
  // Palavras inteiras que, se aparecerem na descrição, ativam a entrada.
  keywords: string[]
  // Nomes de categoria aceitáveis, do mais ao menos provável (sem acento, minúsculos).
  categoryNames: string[]
}

export const CATEGORY_DICTIONARY: DictionaryEntry[] = [
  {
    type: "expense",
    keywords: ["mercadona", "dia", "carrefour", "lidl", "aldi", "alcampo", "eroski", "consum", "supermercado", "supermercados", "extra", "atacadao", "assai", "condis", "hipercor"],
    categoryNames: ["mercado", "supermercado", "alimentacao", "comida", "compras"],
  },
  {
    type: "expense",
    keywords: ["mcdonalds", "mcdonald", "burger", "starbucks", "glovo", "ubereats", "ifood", "telepizza", "dominos", "restaurante", "cafeteria", "panaderia", "pizzeria", "kebab", "bar", "cerveceria"],
    categoryNames: ["restaurantes", "restaurante", "alimentacao", "comida", "lazer"],
  },
  {
    type: "expense",
    keywords: ["metro", "uber", "cabify", "bolt", "renfe", "emt", "taxi", "blablacar", "repsol", "cepsa", "galp", "gasolina", "gasolinera", "alsa", "estacionamento", "parking", "peaje"],
    categoryNames: ["transporte", "locomocao", "combustivel", "carro"],
  },
  {
    type: "expense",
    keywords: ["netflix", "spotify", "hbo", "disney", "primevideo", "youtube", "steam", "playstation", "xbox", "nintendo", "cine", "cinema", "cinesa", "twitch"],
    categoryNames: ["lazer", "assinaturas", "entretenimento", "streaming"],
  },
  {
    type: "expense",
    keywords: ["farmacia", "drogaria", "clinica", "hospital", "dentista", "optica", "medico"],
    categoryNames: ["saude", "farmacia"],
  },
  {
    type: "expense",
    keywords: ["lycamobile", "vodafone", "movistar", "orange", "yoigo", "digi", "masmovil", "claro", "vivo", "tim", "iberdrola", "endesa", "naturgy", "agua"],
    categoryNames: ["moradia", "contas", "telefonia", "servicos", "utilidades"],
  },
  {
    type: "expense",
    keywords: ["alquiler", "aluguel", "comunidad", "condominio", "hipoteca"],
    categoryNames: ["moradia", "aluguel", "casa"],
  },
  {
    type: "expense",
    keywords: ["hostelworld", "booking", "airbnb", "ryanair", "vueling", "iberia", "easyjet", "decolar", "latam", "hotel", "hostal"],
    categoryNames: ["viagem", "viagens", "lazer", "turismo"],
  },
  {
    type: "expense",
    keywords: ["udemy", "coursera", "alura", "escuela", "universidad", "matricula", "curso"],
    categoryNames: ["educacao", "cursos", "estudos"],
  },
  {
    type: "income",
    keywords: ["nomina", "salario", "payroll", "sueldo", "salary", "pagamento"],
    categoryNames: ["salario", "trabalho", "renda"],
  },
]
