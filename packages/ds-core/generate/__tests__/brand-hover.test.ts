import { describe, it, expect } from "vitest";
import { brandTones, buildScale, SCALE_STEPS } from "../scale";
import { generateTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

// O hover da marca saía IGUAL à primary em ~metade das cores custom — botão sem feedback
// nenhum. Causa: `brandTones` recalculava o passo por luminância (`nearestStep`), enquanto o
// `buildScale` crava a cor por outro critério (piso adaptativo + âncora de croma). Quando os
// dois divergiam em um step, o "próximo step" caía exatamente sobre a própria cor.
//
// Invisível nos temas curados (usam ColorRef e não passam por brandTones) e invisível numa
// leitura do código — só aparece rodando cor por cor. Daí a bateria abaixo.
const HEXES = [
  "#7C3AED", // cravada em 600, nearestStep dizia 500 — o caso original
  "#2E7D32", // idem
  "#FFEB3B", // cravada em 200 (amarelo puxa a escala pro claro)
  "#FF6B35",
  "#1E88E5",
  "#0A0A0A", // quase-preto: hover tem que CLAREAR
  "#FFFFFF", // quase-branco: hover tem que ESCURECER
  "#E91E63",
  "#00BCD4",
  "#795548",
  "#607D8B",
  "#F44336",
];

describe("brandTones — hover nunca colide com a primary", () => {
  for (const hex of HEXES) {
    it(`${hex} gera um hover distinto`, () => {
      const { hover } = brandTones(hex);
      expect(hover.toLowerCase()).not.toBe(hex.toLowerCase());
    });
  }

  it("o hover é sempre um step VIZINHO na escala da própria marca", () => {
    for (const hex of HEXES) {
      const scale = buildScale(hex);
      const { hover } = brandTones(hex);
      const iPin = SCALE_STEPS.findIndex((s) => scale[s].toLowerCase() === hex.toLowerCase());
      const iHov = SCALE_STEPS.findIndex((s) => scale[s].toLowerCase() === hover.toLowerCase());
      expect(iHov, `${hex}: hover fora da escala`).toBeGreaterThanOrEqual(0);
      if (iPin >= 0) expect(Math.abs(iHov - iPin), `${hex}: hover não é vizinho`).toBe(1);
    }
  });
});

describe("o tema gerado de uma cor só entrega o par completo", () => {
  const themeOf = (primary: string): BrandDef => ({
    name: "brand",
    brand: { primary },
    surface: "neutral",
    text: "neutral",
    fonts: { body: "inter" },
  });

  it("--brand-hover difere de --brand-primary em todas as cores", () => {
    for (const hex of HEXES) {
      const { light } = generateTheme(themeOf(hex));
      expect(light["--brand-hover"]?.toLowerCase(), hex).not.toBe(light["--brand-primary"]?.toLowerCase());
    }
  });

  it("uma cor só rende secondary e accent derivados (não fica faltando papel)", () => {
    const { light } = generateTheme(themeOf("#7C3AED"));
    expect(light["--brand-secondary"]).toBeTruthy();
    expect(light["--brand-accent"]).toBeTruthy();
    expect(light["--brand-on-primary"]).toBeTruthy();
  });
});
