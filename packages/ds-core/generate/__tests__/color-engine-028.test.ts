import { describe, it, expect } from "vitest";
import { generateTheme, resolveTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

// #523 (color engine 0.28) — escala de marca (#27), resolveTheme (#28), derivação harmônica (#29).
const F = { body: "inter" } as const;
const oneColor: BrandDef = { name: "1cor", brand: { primary: "#2E7D32" }, surface: "neutral", text: "neutral", fonts: F, allowLiteral: true };
const curated: BrandDef = { name: "cur", brand: { primary: "flare-700", secondary: "coal-800", accent: "cobalt-700", onPrimary: "white" }, surface: "neutral", text: "neutral", fonts: F };

describe("#27 — escala de marca --brand-primary-50..900", () => {
  it("emite os 10 steps a partir de hex custom (buildScale)", () => {
    const { light } = generateTheme(oneColor);
    for (const s of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
      expect(light[`--brand-primary-${s}`]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
  it("ref de paleta (tema curado) aponta pra --color-<paleta>-<step>", () => {
    const { light } = generateTheme(curated);
    expect(light["--brand-primary-500"]).toBe("var(--color-flare-500)");
  });
});

describe("#28 — resolveTheme(recipe, { mode })", () => {
  it("mode dark funde light+dark e marca isDark", () => {
    const r = resolveTheme(oneColor, { mode: "dark" });
    expect(r.isDark).toBe(true);
    expect(Object.keys(r.tokens).length).toBeGreaterThan(0);
  });
  it("mode light (ou ausente) devolve só o light", () => {
    const r = resolveTheme(oneColor, { mode: "light" });
    expect(r.isDark).toBe(false);
    expect(resolveTheme(oneColor).isDark).toBe(false);
  });
});

describe("#29 — derivação harmônica de secondary/accent", () => {
  it("primary hex sozinha gera secondary/accent (roda de cor, não vazio)", () => {
    const { light } = generateTheme(oneColor);
    expect(light["--brand-secondary"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(light["--brand-accent"]).toMatch(/^#[0-9a-f]{6}$/i);
    // faísca distinta da marca (não colapsa na primary nem no preto)
    expect(light["--brand-accent"]).not.toBe(light["--brand-primary"]);
    expect(light["--brand-accent"]).not.toBe("#000000");
  });
  it("respeita clamp: não vira quase-preto nem quase-branco", () => {
    const { light } = generateTheme(oneColor);
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16);
    expect(lum(light["--brand-secondary"]!)).toBeGreaterThan(60);
    expect(lum(light["--brand-accent"]!)).toBeGreaterThan(60);
  });
  it("temas curados (3 papéis) passam INTACTOS — não deriva", () => {
    const { light } = generateTheme(curated);
    expect(light["--brand-secondary"]).toBe("var(--color-coal-800)");
    expect(light["--brand-accent"]).toBe("var(--color-cobalt-700)");
  });

  it("dark.brand só com primary → deriva harmônico no dark igual ao light (não vira tint translúcido)", () => {
    // simula um espelho `dark.brand` (só primary) — o dark deve pegar o MESMO secondary
    // derivado do light, não um color-mix translúcido.
    const mirrored: BrandDef = { ...oneColor, dark: { brand: { primary: "#2E7D32" } } };
    const { light, dark } = generateTheme(mirrored);
    // no dark, --brand-secondary ou é omitido (herda o light idêntico) ou repete o mesmo hex —
    // nunca um color-mix translúcido.
    const darkSec = dark["--brand-secondary"];
    if (darkSec !== undefined) {
      expect(darkSec).toBe(light["--brand-secondary"]);
      expect(darkSec).not.toContain("color-mix");
    }
  });
});
