// Os blocos do Dashboard que o usuário pode ligar, desligar e reordenar.
// A ordem desta lista é o layout padrão.
//
// defaultVisible: se o bloco aparece para quem nunca personalizou (e para quem
//   personalizou antes de o bloco existir). Os opcionais começam desligados.
// size: como o bloco ocupa a linha.
//   full   = linha inteira
//   wide   = 2/3 da linha (divide com um "narrow")
//   narrow = 1/3 da linha (divide com um "wide")
//   half   = 1/2 da linha (divide com outro "half")
export const DASHBOARD_WIDGETS = [
  { id: "cards", label: "Resumo do mês", description: "Saldo, receitas e despesas com a variação do período.", defaultVisible: true, size: "full" },
  { id: "insights", label: "Dicas financeiras", description: "Dicas curtas geradas pela IA sobre o seu mês.", defaultVisible: true, size: "full" },
  { id: "chart", label: "Gráfico de saldo", description: "Evolução do saldo e das despesas dia a dia.", defaultVisible: true, size: "wide" },
  { id: "transactions", label: "Últimas transações", description: "As 5 transações mais recentes do mês.", defaultVisible: true, size: "narrow" },
  { id: "top-categories", label: "Top categorias de gasto", description: "Para onde foi o seu dinheiro: as 5 categorias que mais pesam no mês.", defaultVisible: false, size: "half" },
  { id: "spending-pace", label: "Ritmo de gastos", description: "Média diária e projeção de quanto você vai gastar até o fim do mês.", defaultVisible: false, size: "half" },
  { id: "biggest-expenses", label: "Maiores despesas", description: "As 5 maiores despesas individuais do mês.", defaultVisible: false, size: "half" },
  { id: "budgets-at-risk", label: "Orçamentos em risco", description: "Orçamentos estourados ou perto do limite, do mais crítico ao menos.", defaultVisible: false, size: "half" },
  { id: "goals-progress", label: "Metas em andamento", description: "Progresso das suas metas que ainda não foram concluídas.", defaultVisible: false, size: "half" },
] as const

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"]
export type WidgetSize = (typeof DASHBOARD_WIDGETS)[number]["size"]

export const WIDGET_IDS = DASHBOARD_WIDGETS.map((widget) => widget.id) as [WidgetId, ...WidgetId[]]

export const WIDGET_SIZE = Object.fromEntries(
  DASHBOARD_WIDGETS.map((widget) => [widget.id, widget.size])
) as Record<WidgetId, WidgetSize>

export type WidgetPreference = { id: WidgetId; visible: boolean }

export const DEFAULT_LAYOUT: WidgetPreference[] = DASHBOARD_WIDGETS.map((widget) => ({
  id: widget.id,
  visible: widget.defaultVisible,
}))

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && (WIDGET_IDS as readonly string[]).includes(value)
}

// O que vem do banco é JSON qualquer: pode estar vazio, corrompido ou de uma versão
// antiga do app. Aproveita as entradas válidas (na ordem salva, a primeira de cada
// bloco) e acrescenta no fim os blocos que faltam, com a visibilidade padrão de cada
// um (blocos opcionais criados depois não aparecem sozinhos). Nunca lança erro.
export function normalizeLayout(saved: unknown): WidgetPreference[] {
  const result: WidgetPreference[] = []
  const seen = new Set<WidgetId>()

  if (Array.isArray(saved)) {
    for (const entry of saved) {
      if (typeof entry !== "object" || entry === null) continue
      const { id, visible } = entry as { id?: unknown; visible?: unknown }
      if (!isWidgetId(id) || typeof visible !== "boolean" || seen.has(id)) continue
      seen.add(id)
      result.push({ id, visible })
    }
  }

  for (const widget of DEFAULT_LAYOUT) {
    if (!seen.has(widget.id)) result.push({ ...widget })
  }

  return result
}

// Dois blocos vizinhos dividem a linha quando os tamanhos se completam:
// wide + narrow (em qualquer ordem) ou half + half.
function canShareRow(a: WidgetId, b: WidgetId): boolean {
  const sizes = [WIDGET_SIZE[a], WIDGET_SIZE[b]]
  return (
    (sizes.includes("wide") && sizes.includes("narrow")) ||
    (sizes[0] === "half" && sizes[1] === "half")
  )
}

// Agrupa os blocos visíveis em linhas, na ordem escolhida. Um bloco que não tem
// par ao lado ocupa a linha inteira.
export function buildDashboardRows(layout: WidgetPreference[]): WidgetId[][] {
  const visible = layout.filter((widget) => widget.visible).map((widget) => widget.id)
  const rows: WidgetId[][] = []

  for (let index = 0; index < visible.length; index++) {
    const current = visible[index]
    const next = visible[index + 1]

    if (next !== undefined && canShareRow(current, next)) {
      rows.push([current, next])
      index++
    } else {
      rows.push([current])
    }
  }

  return rows
}
