// Os blocos do Dashboard que o usuário pode ligar, desligar e reordenar.
// A ordem desta lista é o layout padrão.
export const DASHBOARD_WIDGETS = [
  { id: "cards", label: "Resumo do mês", description: "Saldo, receitas e despesas com a variação do período." },
  { id: "insights", label: "Dicas financeiras", description: "Dicas curtas geradas pela IA sobre o seu mês." },
  { id: "chart", label: "Gráfico de saldo", description: "Evolução do saldo e das despesas dia a dia." },
  { id: "transactions", label: "Últimas transações", description: "As 5 transações mais recentes do mês." },
] as const

export type WidgetId = (typeof DASHBOARD_WIDGETS)[number]["id"]

export const WIDGET_IDS = DASHBOARD_WIDGETS.map((widget) => widget.id) as [WidgetId, ...WidgetId[]]

export type WidgetPreference = { id: WidgetId; visible: boolean }

export const DEFAULT_LAYOUT: WidgetPreference[] = DASHBOARD_WIDGETS.map((widget) => ({
  id: widget.id,
  visible: true,
}))

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && (WIDGET_IDS as readonly string[]).includes(value)
}

// O que vem do banco é JSON qualquer: pode estar vazio, corrompido ou de uma versão
// antiga do app. Aproveita as entradas válidas (na ordem salva, a primeira de cada
// bloco) e acrescenta no fim, visíveis, os blocos que faltam. Nunca lança erro.
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

// Agrupa os blocos visíveis em linhas. O gráfico e as últimas transações, quando
// ficam um ao lado do outro na ordem escolhida, dividem a linha (2/3 e 1/3);
// todo o resto ocupa a linha inteira.
export function buildDashboardRows(layout: WidgetPreference[]): WidgetId[][] {
  const visible = layout.filter((widget) => widget.visible).map((widget) => widget.id)
  const rows: WidgetId[][] = []

  for (let index = 0; index < visible.length; index++) {
    const current = visible[index]
    const next = visible[index + 1]
    const isPair =
      (current === "chart" && next === "transactions") ||
      (current === "transactions" && next === "chart")

    if (isPair) {
      rows.push([current, next])
      index++
    } else {
      rows.push([current])
    }
  }

  return rows
}
