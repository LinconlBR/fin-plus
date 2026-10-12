// Extrai uma "chave de estabelecimento" estável da descrição de um extrato.
// "PAGO MOVIL EN MERCADONA SAN D, MADRID ES, TARJ. :*828919" e
// "PAGO MOVIL EN MERCADONA SAN J, MADRID ES, TARJ. :*828919" viram a mesma
// chave ("mercadona san"), então uma categoria aprendida numa vale para a outra.

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
}

// Palavras sem valor para identificar quem é o estabelecimento.
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "a", "y", "en", "da", "do", "dos", "das", "e"])

const CARD_PREFIX =
  /^(pago movil en|pago con tarjeta en|pago tarjeta en|pago en|compra en|compra|pagamento em|pagamento|debito em|recibo|adeudo|cargo|retirada)\s+/

const MAX_KEY_WORDS = 2
const MAX_KEY_LENGTH = 60

export function extractMerchantKey(description: string): string {
  let text = normalize(description).replace(/\s+/g, " ").trim()

  // Bizum e transferências: o que identifica é a pessoa/empresa, não a palavra "a favor de".
  const person = /^(bizum|transferencia|transferencia inmediata|traspaso)\s+(?:a favor de|de|a)\s+(.+)$/.exec(text)
  if (person) text = `${person[1].replace(/ inmediata$/, "")} ${person[2]}`
  else text = text.replace(CARD_PREFIX, "")

  // Depois de "concepto" vem texto livre; depois da primeira vírgula, cidade e cartão.
  text = text.split(/\bconcepto\b/)[0].split(",")[0]

  const words = text
    .replace(/[^a-z0-9.\s*]/g, " ")
    .split(/\s+/)
    // Números (loja nº, final do cartão, comissão) variam e não identificam ninguém.
    .filter((w) => w !== "" && !/\d/.test(w) && !w.includes("*") && !STOPWORDS.has(w))

  return words.slice(0, MAX_KEY_WORDS).join(" ").slice(0, MAX_KEY_LENGTH).trim()
}
