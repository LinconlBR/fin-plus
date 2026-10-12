// Planos e funcionalidades do Fin+. Toda decisão "esta pessoa pode usar isto?"
// passa por canUseFeature(), então ligar a cobrança depois é mudar um lugar só.

export type Plan = "free" | "plus"

export type Feature = "ai_insights" | "pdf_export" | "open_finance"

// Plano mínimo para cada funcionalidade. Quem tem "plus" tem tudo do "free".
export const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  ai_insights: "plus",
  pdf_export: "plus",
  open_finance: "plus",
}

const PLAN_RANK: Record<Plan, number> = { free: 0, plus: 1 }

// Enquanto a cobrança não existe, TODAS as funcionalidades ficam liberadas.
// Para ativar os planos: PLANS_ENFORCED=true (depois da integração de pagamento).
export function arePlansEnforced(): boolean {
  return process.env.PLANS_ENFORCED === "true"
}

export function planIncludes(plan: Plan, feature: Feature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]]
}

// Função pura (recebe tudo por parâmetro) para ser fácil de testar.
export function canUseFeature(
  plan: Plan,
  feature: Feature,
  enforced: boolean = arePlansEnforced()
): boolean {
  return !enforced || planIncludes(plan, feature)
}
