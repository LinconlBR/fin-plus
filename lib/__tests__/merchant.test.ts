import { describe, expect, it } from "vitest"
import { extractMerchantKey } from "@/lib/merchant"

describe("extractMerchantKey", () => {
  it.each([
    ["PAGO MOVIL EN MERCADONA SAN D, MADRID ES, TARJ. :*828919", "mercadona san"],
    ["PAGO MOVIL EN MERCADONA SAN J, MADRID ES, TARJ. :*828919", "mercadona san"],
    ["PAGO MOVIL EN DIA 9419, MADRID ES, TARJ. :*828919", "dia"],
    ["PAGO MOVIL EN METRO DE MADRID, MADRID ES, TARJ. :*828919", "metro madrid"],
    ["PAGO MOVIL EN YOHE BARBER, MADRID ES, TARJ. :*828919", "yohe barber"],
    ["COMPRA Lycamobile, Alcobendas, TARJETA 0000000000000000 , COMISION 0,00", "lycamobile"],
    ["COMPRA WWW.HOSTELWORLD.COM, DUBLIN, TARJETA 0000 , COMISION 0,00", "www.hostelworld.com"],
  ])("%s → %s", (description, expected) => {
    expect(extractMerchantKey(description)).toBe(expected)
  })

  it("usa a pessoa como chave no Bizum, sem o texto livre", () => {
    expect(extractMerchantKey("BIZUM A FAVOR DE EUSEBIO GONZALEZ SERVIN CONCEPTO: prestimo")).toBe("bizum eusebio")
    expect(extractMerchantKey("BIZUM DE EUSEBIO GONZALEZ SERVIN CONCEPTO E")).toBe("bizum eusebio")
  })
  it("usa a origem na transferência", () => {
    expect(extractMerchantKey("TRANSFERENCIA DE MYPRIMARKET, S.L., CONCEPTO NOMINA.")).toBe("transferencia myprimarket")
  })
  it("ignora maiúsculas e acentos", () => {
    expect(extractMerchantKey("Pago Móvil En Panadería López")).toBe("panaderia lopez")
  })
  it("devolve vazio quando não sobra nada identificável", () => {
    expect(extractMerchantKey("1234 5678")).toBe("")
    expect(extractMerchantKey("")).toBe("")
  })
  it("limita o tamanho da chave", () => {
    expect(extractMerchantKey("x".repeat(200)).length).toBeLessThanOrEqual(60)
  })
})
