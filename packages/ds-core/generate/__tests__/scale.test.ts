import { describe, it, expect } from "vitest";
import {
  buildScale,
  SCALE_STEPS,
  hexToHsl,
  hslToHex,
  relativeLuminance,
  contrastRatio,
  onColor,
} from "../scale";

describe("buildScale", () => {
  it("emite os 10 steps 50–900", () => {
    const scale = buildScale("#d4476a");
    expect(Object.keys(scale).map(Number)).toEqual(SCALE_STEPS);
    for (const step of SCALE_STEPS) expect(scale[step]).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("crava a cor original exata em algum step (preserva a escolha do usuário)", () => {
    const input = "#d4476a";
    const scale = buildScale(input);
    expect(Object.values(scale)).toContain(input.toLowerCase());
  });

  it("é monotônica: 50 é mais claro que 900", () => {
    const scale = buildScale("#2563eb");
    expect(relativeLuminance(scale[50])).toBeGreaterThan(relativeLuminance(scale[900]));
  });

  it("mantém o matiz ao longo da escala", () => {
    const [h] = hexToHsl("#2563eb");
    const scale = buildScale("#2563eb");
    // tons derivados (não-âncora) ficam perto do matiz de entrada (±8°)
    for (const step of [100, 500, 800] as const) {
      const [hs] = hexToHsl(scale[step]);
      const delta = Math.min(Math.abs(hs - h), 360 - Math.abs(hs - h));
      expect(delta).toBeLessThanOrEqual(8);
    }
  });

  it("é determinística", () => {
    expect(buildScale("#16a34a")).toEqual(buildScale("#16a34a"));
  });
});

describe("HSL <-> HEX", () => {
  it("round-trip aproximado", () => {
    const hex = "#d4476a";
    const [h, s, l] = hexToHsl(hex);
    const back = hexToHsl(hslToHex(h, s, l));
    expect(back[2]).toBeCloseTo(l, -1);
  });
});

describe("contraste WCAG", () => {
  it("branco/preto = 21:1", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
  });

  it("onColor escolhe o texto de maior contraste sobre a cor de marca", () => {
    const bg = "#d4476a"; // rosé médio saturado
    const on = onColor(bg, buildScale(bg));
    expect(contrastRatio(bg, on)).toBeGreaterThanOrEqual(4.5);
  });

  it("onColor dá branco sobre fundo escuro e preto sobre fundo claro", () => {
    expect(onColor("#0a0a0a")).toBe("#ffffff");
    expect(onColor("#f5f5f5")).toBe("#000000");
  });
});
