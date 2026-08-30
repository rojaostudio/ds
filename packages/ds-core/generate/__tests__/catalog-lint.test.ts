import { describe, it, expect } from "vitest";
import { NICHE_THEMES } from "../../themes/index";

// Lint de catálogo (#350 Fase 5): impede que dois temas do MESMO modo voltem a
// colidir na cor de marca (foi o caso dos "dois vermelhos" burger×tattoo). O guard
// é grosseiro de propósito — só pega marcas cromáticas quase idênticas em matiz E
// saturação. Pares intencionalmente próximos em matiz mas distintos em saturação
// (padaria laranja × café marrom; doceria × estética) passam naturalmente.

type Hsl = { h: number; s: number; l: number };
function hexToHsl(hex: string): Hsl {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0, s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
const hueDelta = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

describe("catálogo de temas — lint de colisão de cor (#350)", () => {
  // Só temas com primary em hex cromático (saturação real). Mono/neutro fica de fora.
  const chromatic = NICHE_THEMES
    .filter((t) => typeof t.recipe.brand.primary === "string" && t.recipe.brand.primary.startsWith("#"))
    .map((t) => ({ id: t.skin, mode: t.mode, ...hexToHsl(t.recipe.brand.primary as string) }))
    .filter((t) => t.s > 0.2);

  it("nenhum par do mesmo modo colide em matiz E saturação", () => {
    const collisions: string[] = [];
    for (let i = 0; i < chromatic.length; i++) {
      for (let j = i + 1; j < chromatic.length; j++) {
        const a = chromatic[i], b = chromatic[j];
        if (a.mode !== b.mode) continue;
        // colisão = matiz quase igual (<25°) E saturação quase igual (<0.18)
        if (hueDelta(a.h, b.h) < 25 && Math.abs(a.s - b.s) < 0.18) {
          collisions.push(`${a.id} × ${b.id} (${a.mode})`);
        }
      }
    }
    expect(collisions, `colisões de cor de marca: ${collisions.join(", ")}`).toEqual([]);
  });

  it("ids e skins são únicos", () => {
    const ids = NICHE_THEMES.map((t) => t.id);
    const skins = NICHE_THEMES.map((t) => t.skin);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(skins).size).toBe(skins.length);
  });
});
