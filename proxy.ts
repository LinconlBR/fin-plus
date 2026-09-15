// Este arquivo é o "proxy" do Next.js 16, que substitui o antigo "middleware.ts" do Next.js 13.
// Ele é responsável por atualizar a sessão do usuário em cada request, garantindo que o estado de autenticação esteja correto. 
// A função `updateSession` é chamada para verificar e atualizar a sessão do usuário com base no request recebido.
// O matcher no final do arquivo garante que o proxy não seja executado em requests de arquivos estáticos, como imagens ou favicon, 
// evitando processamento desnecessário e melhorando a performance.

import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

// RENOMEADO NO NEXT.JS 16: este arquivo se chamava "middleware.ts" e a função
// "middleware" em versões anteriores do framework. A partir do Next 16, a convenção
// oficial passou a ser "proxy.ts" / função "proxy" — mesmo mecanismo, nome novo.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// O matcher evita rodar essa função em arquivos estáticos (imagens, favicon) — sem
// ele, o proxy processaria literalmente todo request, incluindo assets que não
// precisam de checagem de sessão.
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

// AVISO DE SEGURANÇA: este arquivo (e a função updateSession chamada aqui) cuidam só
// da EXPERIÊNCIA — redirecionar visualmente quem não está logado. Não é a defesa real
// dos dados. Existe uma vulnerabilidade conhecida (CVE-2025-29927) que permite
// contornar checagens feitas só no middleware/proxy. A segurança de verdade deste
// projeto está nas RLS policies do Supabase (auth.uid() = user_id em cada tabela) —
// mesmo que alguém burlasse este arquivo, o banco recusaria a query sem o usuário
// certo autenticado.