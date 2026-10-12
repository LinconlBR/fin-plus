// Nomes das páginas no breadcrumb, pelo caminho completo (o mesmo segmento pode
// significar coisas diferentes: "categories" em /reports e em /customize).
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transações",
  "/budgets": "Orçamentos",
  "/goals": "Metas",
  "/reports": "Relatórios",
  "/reports/categories": "Gastos por categoria",
  "/reports/income-vs-expense": "Receitas vs despesas",
  "/reports/period-comparison": "Comparativo de períodos",
  "/reports/goals-evolution": "Evolução das metas",
  "/reports/balance-projection": "Projeção de saldo",
  "/tips": "Dicas financeiras",
  "/settings": "Conta",
  "/customize": "Personalizar",
  "/customize/dashboard": "Dashboard",
  "/customize/categories": "Categorias",
}

export type BreadcrumbItem = { label: string; href: string }

// "/reports/categories" -> [{ Relatórios, /reports }, { Gastos por categoria, /reports/categories }]
// Cada item linka para o caminho acumulado até ele, não só para o último trecho.
// Segmento desconhecido usa o próprio texto da URL.
export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean)

  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    return { label: PAGE_LABELS[href] ?? segment, href }
  })
}
