import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import { refToHex, contrastRatio } from "../scale";
import type { BrandDef } from "../../tokens/recipe.schema";

// #87 — a borda que IDENTIFICA um controle (campo, caixa, seletor) precisa de 3:1 sobre a
// superfície, por WCAG 1.4.11. As outras três (`subtle`, `default`, `strong`) são decoração —
// separador, card, faixa — e continuam sutis de propósito.
//
// O buraco existia porque o Input desenhava o campo com `--border-default`: 1.45:1 sobre o
// branco, em QUALQUER marca. Não dependia da cor de quem chega — era dívida da base, e só
// apareceu quando o painel de contraste foi ligado na entrega pública.
const MIN = 3;

const hexOf = (v: string | undefined): string | null => {
  if (!v) return null;
  if (v.startsWith("#")) return v;
  const m = v.match(/^var\(--color-([a-z]+)-(\d+)\)$/);
  if (m) return refToHex(`${m[1]}-${m[2]}`);
  if (v === "var(--color-white)") return "#ffffff";
  if (v === "var(--color-black)") return "#000000";
  return null; // color-mix — só o browser resolve; coberto pelo caso light
};

const tema = (surface: string, text: string): BrandDef => ({
  name: "b",
  brand: { primary: "#4F46E5" },
  surface: surface as BrandDef["surface"],
  text: text as BrandDef["text"],
  fonts: { body: "inter" },
});

describe("#87 — borda de controle atinge 3:1", () => {
  // As famílias neutras DESTE design system — `stone`/`slate` são do Tailwind e não existem
  // aqui (a lista real está em tokens/index.ts: neutral, cream, clay, moss…).
  for (const [surface, text] of [["neutral", "neutral"], ["cream", "neutral"], ["clay", "neutral"]] as const) {
    it(`${surface}: --border-control contrasta com as superfícies claras`, () => {
      const { light } = generateTheme(tema(surface, text));
      const borda = hexOf(light["--border-control"]);
      expect(borda, "o motor precisa emitir --border-control").toBeTruthy();

      for (const alvo of ["--surface-default", "--surface-page"]) {
        const fundo = hexOf(light[alvo]);
        if (!fundo) continue;
        const r = contrastRatio(borda!, fundo);
        expect(r, `${surface}: borda de controle sobre ${alvo} = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(MIN);
      }
    });
  }

  it("continua mais forte que as bordas decorativas", () => {
    const { light } = generateTheme(tema("neutral", "neutral"));
    const fundo = "#ffffff";
    const controle = contrastRatio(hexOf(light["--border-control"])!, fundo);
    const decorativa = contrastRatio(hexOf(light["--border-default"])!, fundo);
    expect(controle).toBeGreaterThan(decorativa);
  });

  it("o modo escuro também emite o token", () => {
    const { dark } = generateTheme(tema("neutral", "neutral"));
    expect(dark["--border-control"]).toBeTruthy();
  });
});
