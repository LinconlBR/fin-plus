import { describe, expect, it } from "vitest"
import {
  profileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "@/lib/schema/settings"
import { signupSchema } from "@/lib/schema/signup"

describe("profileSchema", () => {
  it("remove espaços e aceita nome válido", () => {
    expect(profileSchema.parse({ full_name: "  Ana  " }).full_name).toBe("Ana")
  })
  it.each(["", "   ", "a".repeat(101)])("rejeita nome inválido (%j)", (full_name) => {
    expect(profileSchema.safeParse({ full_name }).success).toBe(false)
  })
})

describe("changePasswordSchema", () => {
  const valid = { current_password: "Antiga@1", new_password: "Nova@123", confirm_password: "Nova@123" }
  it("aceita troca válida", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true)
  })
  it("rejeita senha nova fraca", () => {
    expect(changePasswordSchema.safeParse({ ...valid, new_password: "abcdef", confirm_password: "abcdef" }).success).toBe(false)
  })
  it("rejeita confirmação diferente", () => {
    expect(changePasswordSchema.safeParse({ ...valid, confirm_password: "Outra@123" }).success).toBe(false)
  })
  it("rejeita nova senha igual à atual", () => {
    expect(changePasswordSchema.safeParse({ ...valid, current_password: "Nova@123" }).success).toBe(false)
  })
  it("exige a senha atual", () => {
    expect(changePasswordSchema.safeParse({ ...valid, current_password: "" }).success).toBe(false)
  })
})

describe("deleteAccountSchema", () => {
  it("aceita só a palavra exata", () => {
    expect(deleteAccountSchema.safeParse({ confirmation: "EXCLUIR" }).success).toBe(true)
    expect(deleteAccountSchema.safeParse({ confirmation: "excluir" }).success).toBe(false)
    expect(deleteAccountSchema.safeParse({}).success).toBe(false)
  })
})

describe("signupSchema (senha compartilhada)", () => {
  it("continua exigindo senha forte", () => {
    const base = { email: "a@b.com", name: "Ana", password: "fraca1", confirm_password: "fraca1" }
    expect(signupSchema.safeParse(base).success).toBe(false)
    expect(signupSchema.safeParse({ ...base, password: "Forte@12", confirm_password: "Forte@12" }).success).toBe(true)
  })
})
