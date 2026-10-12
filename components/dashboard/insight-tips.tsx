"use client";

import { useQuery } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { generateDashboardTips } from "@/lib/actions/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// A resposta da IA é texto livre: limpa marcadores, tira linhas vazias, no máximo 3.
function parseTips(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^[\s\-•*\d.)]+/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

export function DashboardTips({
  month,
  summary,
  fallback,
}: {
  month: string;
  summary: string;
  fallback: string;
}) {
  const { data } = useQuery({
    queryKey: ["dashboard-tips", month, summary],
    queryFn: () => generateDashboardTips(summary),
    enabled: summary !== "", // sem movimento no mês, não há o que analisar
    staleTime: 1000 * 60 * 30, // mesmos dados = mesmas dicas
  });

  const aiTips = data ? parseTips(data) : [];
  // Se a IA falhar ou ainda não respondeu, mostra o texto por regras.
  const tips = aiTips.length > 0 ? aiTips : fallback ? [fallback] : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Lightbulb className="size-4 text-accent-violet" />
        <CardTitle>Dicas Financeiras</CardTitle>
      </CardHeader>
      <CardContent>
        {tips.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Registre transações para receber dicas personalizadas.
          </p>
        ) : (
          <ul className="space-y-2 text-sm text-foreground/90">
            {tips.map((tip) => (
              <li key={tip} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent-violet" />
                {tip}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
