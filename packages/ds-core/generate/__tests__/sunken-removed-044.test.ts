import { describe, it, expect } from "vitest";
import { generateTheme, resolveTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

// #44 — os tokens de "sunken" (a variante escurecida da secondary) viraram dead output depois do
// épico de cor do um produto consumidor (#523 / 0.29.0): a banda de identidade das faces passou a usar a secondary
// LITERAL. Este teste trava a AUSÊNCIA — se alguém reintroduzir a emissão, quebra aqui.
const F = { body: "inter" } as const;

const chromatic: BrandDef = {
  name: "chr",
  brand: { primary: "#C45454", secondary: "#2E7D32" },
  surface: "neutral",
  text: "neutral",
  fonts: F,
  allowLiteral: true,
};

// Secondary quase-preta: era o caso que caía no ramo `surfaceable === false` do sunken no dark.
const nearBlack: BrandDef = {
  name: "nbk",
  brand: { primary: "#C45454", secondary: "#0A0A0A" },
  surface: "neutral",
  text: "neutral",
  fonts: F,
  allowLiteral: true,
};

const SUNKEN = ["--brand-secondary-sunken", "--brand-on-secondary-sunken"];

describe("#44 — tokens sunken não são mais emitidos", () => {
  for (const def of [chromatic, nearBlack]) {
    for (const mode of ["light", "dark"] as const) {
      it(`${def.name}/${mode} não emite ${SUNKEN.join(" nem ")}`, () => {
        const { tokens } = resolveTheme(def, { mode });
        for (const t of SUNKEN) expect(tokens).not.toHaveProperty(t);
      });
    }
  }

  it("o CSS gerado não carrega nenhum sunken", () => {
    for (const def of [chromatic, nearBlack]) {
      expect(generateTheme(def)).not.toContain("sunken");
    }
  });

  it("surface e band da banda de identidade seguem intactos", () => {
    // Cromática: banda pinta com a cor da marca nos dois modos.
    expect(resolveTheme(chromatic, { mode: "light" }).tokens["--brand-secondary-surface"])
      .toBe("var(--brand-secondary)");
    expect(resolveTheme(chromatic, { mode: "dark" }).tokens["--brand-secondary-band"])
      .toBe("var(--brand-secondary)");
    // Neutra (quase-preta) no dark: surface cai na família neutra e a banda some pra a página passar.
    const nb = resolveTheme(nearBlack, { mode: "dark" }).tokens;
    expect(nb["--brand-secondary-surface"]).toBe("var(--surface-page)");
    expect(nb["--brand-secondary-band"]).toBe("transparent");
  });
});
