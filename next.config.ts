import type { NextConfig } from "next";

// Cabeçalhos de segurança aplicados a todas as rotas.
// - X-Frame-Options + frame-ancestors: impedem que outro site embuta o app
//   num <iframe> (clickjacking). Um app financeiro nunca precisa ser embutido.
// - nosniff: o navegador respeita o Content-Type e não "adivinha" scripts.
// - Referrer-Policy: não vaza a URL completa (com ?month= etc.) para outros sites.
// - Permissions-Policy: o app não usa câmera, microfone, localização nem pagamento.
// - HSTS: o navegador só fala HTTPS com o domínio por 1 ano.
// Uma CSP completa (script-src com nonce) fica para uma etapa própria: exige
// mexer no proxy e testar todas as telas, e aqui só entra o que é seguro.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // Não anuncia "X-Powered-By: Next.js" (informação útil só para quem ataca).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
