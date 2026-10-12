import { describe, expect, it } from "vitest"
import { canUseFeature, planIncludes, FEATURE_MIN_PLAN, type Feature } from "@/lib/plans"

const features = Object.keys(FEATURE_MIN_PLAN) as Feature[]

describe("planIncludes", () => {
  it.each(features)("plus inclui %s", (feature) => {
    expect(planIncludes("plus", feature)).toBe(true)
  })
  it.each(features)("free não inclui %s", (feature) => {
    expect(planIncludes("free", feature)).toBe(false)
  })
})

describe("canUseFeature", () => {
  it.each(features)("sem cobrança ativa, free usa %s", (feature) => {
    expect(canUseFeature("free", feature, false)).toBe(true)
  })
  it.each(features)("com cobrança ativa, free é bloqueado em %s", (feature) => {
    expect(canUseFeature("free", feature, true)).toBe(false)
  })
  it.each(features)("com cobrança ativa, plus usa %s", (feature) => {
    expect(canUseFeature("plus", feature, true)).toBe(true)
  })
})
