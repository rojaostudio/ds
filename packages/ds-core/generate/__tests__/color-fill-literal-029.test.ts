import { describe, it, expect } from "vitest";
import { generateTheme, resolveTheme } from "../generateTheme";
import { contrastRatio } from "../scale";
import type { BrandDef } from "../../tokens/recipe.schema";

// #523 (0.29) — a cor da MARCA é intenção do lojista: emitida LITERAL, nunca reancorada
// pra contrastar com a superfície. O contraste mora no par on-primary (texto do botão) e
// em --brand-text (marca usada como texto). Reverte o guarda DS-1 (#26) que empurrava a
// cor da marca — mantendo o guarda onde ele pertence (texto/foco).
const F = { body: "inter" } as const;

// Espelho do override do um produto consumidor: primary preta no light e no dark (mode dark).
const blackMirror: BrandDef = {
  name: "blk",
  brand: { primary: "#000000" },
  dark: { brand: { primary: "#000000" } },
  surface: "neutral",
  text: "neutral",
  fonts: F,
  allowLiteral: true,
};

// Primary clara (amarelo): no light NÃO contrasta com o branco — antes era escurecida.
const brightYellow: BrandDef = {
  name: "yel",
  brand: { primary: "#FFEB3B" },
  surface: "neutral",
  text: "neutral",
  fonts: F,
  allowLiteral: true,
};

describe("#523/0.29 — fill da marca é LITERAL (sem reancorar)", () => {
  it("marca preta fica #000000 no dark (não vira cinza)", () => {
    const r = resolveTheme(blackMirror, { mode: "dark" });
    expect(r.tokens["--brand-primary"]).toBe("#000000");
  });

  it("on-primary garante o texto do botão legível sobre o preto", () => {
    const r = resolveTheme(blackMirror, { mode: "dark" });
    const on = r.tokens["--brand-on-primary"]!;
    // texto branco sobre fill preto — contraste no TEXTO, não na cor da marca
    expect(on.toLowerCase()).toContain("ffffff");
    expect(contrastRatio("#000000", "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("--brand-text AINDA reancora: marca como TEXTO precisa contrastar com a página", () => {
    const r = resolveTheme(blackMirror, { mode: "dark" });
    // preto puro some no fundo escuro quando usado como texto → reancora pra tom legível
    expect(r.tokens["--brand-text"]).not.toBe("#000000");
  });

  it("primary clara fica literal no light (não escurece pra contrastar com a página)", () => {
    const { light } = generateTheme(brightYellow);
    expect(light["--brand-primary"]).toBe("#FFEB3B");
    // on-primary preto mantém o texto do botão legível sobre o amarelo
    expect(light["--brand-on-primary"]!.toLowerCase()).toContain("000000");
  });
});

// Cor literal + affordance: quando o fill encosta na superfície, o motor emite um hairline
// (--brand-primary-border) pro botão não sumir — sem tocar na cor. Acima do piso, não emite.
describe("#523/0.29 — affordance da marca-fill (--brand-primary-border)", () => {
  it("emite hairline quando o fill preto encosta na página escura", () => {
    const r = resolveTheme(blackMirror, { mode: "dark" });
    const b = r.tokens["--brand-primary-border"];
    expect(b).toBeDefined();
    expect(b).toContain("--brand-on-primary");
    expect(b).toContain("color-mix");
  });

  it("emite hairline quando o fill amarelo encosta na página clara", () => {
    const { light } = generateTheme(brightYellow);
    expect(light["--brand-primary-border"]).toBeDefined();
  });

  it("NÃO emite borda quando o fill contrasta com a superfície (não é preciso)", () => {
    // #2E7D32 (verde escuro) sobre página clara neutra → contraste bom → sem hairline.
    const green: BrandDef = { name: "grn", brand: { primary: "#2E7D32" }, surface: "neutral", text: "neutral", fonts: F, allowLiteral: true };
    expect(generateTheme(green).light["--brand-primary-border"]).toBeUndefined();
  });
});
