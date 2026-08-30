import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import { refToHex, contrastRatio } from "../scale";
import { recipes } from "../../recipes/index";

// #91 · #92 · #93 — três defeitos com a mesma raiz: a escala de texto era calibrada contra a
// PÁGINA, e a `--surface-raised` (o tom mais claro das três) nunca entrou na conta. O
// `validate-themes.ts` não pegava porque ele compara o gerador com o arquivo à mão — mede
// fidelidade de geração, nunca contraste. Este teste é a parte que faltava.
//
// A descoberta que mudou o diagnóstico do #91: o `--text-muted` NÃO estava "faltando" no bloco
// escuro. O motor emitia — com o mesmo valor do claro (500, o único token de texto que não
// invertia). Como `generateTheme` monta o dark como DIFF do light, valor igual = linha omitida.
// O sintoma era a ausência no CSS; a causa era o degrau nunca ter se mexido.
const AA = 4.5;

const SUPERFICIES = ["--surface-page", "--surface-default", "--surface-raised"] as const;
// O placeholder entrou na lista com a #109: ele NAO e isento (e conteudo — a instrucao de como
// preencher o campo). O --text-disabled fica de fora de proposito: a 1.4.3 dispensa componente
// desabilitado, e e o unico token de texto que pode ficar abaixo do piso.
const TEXTOS = ["--text-primary", "--text-secondary", "--text-muted", "--text-placeholder"] as const;

/** Resolve o token pra hex. `null` = color-mix/alpha, que só o browser fecha. */
const hexOf = (v: string | undefined): string | null => {
  if (!v) return null;
  if (v.startsWith("#")) return v;
  if (v === "var(--color-white)") return "#ffffff";
  if (v === "var(--color-black)") return "#000000";
  const m = v.match(/^var\(--color-([a-z]+)-(\d+)\)$/);
  return m ? refToHex(`${m[1]}-${m[2]}`) : null;
};

describe("#91 · #92 · #109 — escala de texto atinge AA sobre as três superfícies", () => {
  for (const [nome, def] of Object.entries(recipes)) {
    const { light, dark } = generateTheme(def);
    const modos = { claro: light, escuro: { ...light, ...dark } };

    for (const [modo, mapa] of Object.entries(modos)) {
      for (const texto of TEXTOS) {
        for (const superficie of SUPERFICIES) {
          const rotulo = `${nome} · ${modo} · ${texto} sobre ${superficie}`;
          const fg = hexOf(mapa[texto]);
          const bg = hexOf(mapa[superficie]);
          if (!fg || !bg) continue; // color-mix — fora do alcance de uma medição estática

          it(rotulo, () => {
            expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
          });
        }
      }
    }
  }
});

describe("#93 — o par invertido existe e contrasta", () => {
  for (const [nome, def] of Object.entries(recipes)) {
    const { light, dark } = generateTheme(def);
    for (const [modo, mapa] of Object.entries({ claro: light, escuro: { ...light, ...dark } })) {
      it(`${nome} · ${modo}: --surface-invert existe`, () => {
        // O base.css exporta `--color-surface-invert` no @theme inline. Utilitário exportado
        // sem origem = classe que não pinta nada, e o ToggleGroup selecionado ficava branco
        // sobre transparente: 1:1.
        expect(mapa["--surface-invert"], "--surface-invert precisa ter origem").toBeTruthy();
      });

      it(`${nome} · ${modo}: --text-inverse contrasta sobre --surface-invert`, () => {
        const fg = hexOf(mapa["--text-inverse"]);
        const bg = hexOf(mapa["--surface-invert"]);
        if (!fg || !bg) return;
        expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
      });
    }
  }
});
