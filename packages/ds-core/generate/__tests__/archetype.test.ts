import { describe, it, expect } from "vitest";
import { generateTheme } from "../generateTheme";
import type { BrandDef } from "../../tokens/recipe.schema";

// Onda 4 (#350) — eixo de arquétipo de template. Todos os campos são opt-in e
// diff-clean: um recipe que não os declara não emite nenhuma var nova.
const base: BrandDef = {
  name: "t",
  archetype: "chromatic",
  brand: { primary: "teal-500" },
  surface: "neutral",
  text: "neutral",
  fonts: { body: "inter" },
};

describe("generateTheme — surfacePattern (#350 Onda 4)", () => {
  it("não emite textura quando o recipe não traz surfacePattern (diff-clean)", () => {
    const { light } = generateTheme(base);
    expect(light["--surface-texture"]).toBeUndefined();
    expect(light["--surface-texture-size"]).toBeUndefined();
  });

  it("'none' é no-op explícito", () => {
    const { light } = generateTheme({ ...base, surfacePattern: "none" });
    expect(light["--surface-texture"]).toBeUndefined();
  });

  it("emite --surface-texture + size para cada padrão", () => {
    for (const p of ["dots", "grain", "rays", "soft-blobs"] as const) {
      const { light } = generateTheme({ ...base, surfacePattern: p });
      expect(light["--surface-texture"], p).toBeTruthy();
      expect(light["--surface-texture-size"], p).toBeTruthy();
    }
  });

  it("dots usa um padrão de pontos repetível (tamanho fixo)", () => {
    const { light } = generateTheme({ ...base, surfacePattern: "dots" });
    expect(light["--surface-texture"]).toContain("radial-gradient");
    expect(light["--surface-texture-size"]).toBe("16px 16px");
  });

  it("vale também na perna mix (scaleMode: 'mix')", () => {
    const { light } = generateTheme({ ...base, scaleMode: "mix", surfacePattern: "rays" });
    expect(light["--surface-texture"]).toContain("conic-gradient");
  });
});

describe("generateTheme — card (#350 Onda 4)", () => {
  it("sem `card` não emite nenhuma var de card (diff-clean)", () => {
    const { light } = generateTheme(base);
    expect(light["--card-shadow"]).toBeUndefined();
    expect(light["--card-image-ratio"]).toBeUndefined();
    expect(light["--card-overlay"]).toBeUndefined();
  });

  it("emite só os papéis declarados", () => {
    const { light } = generateTheme({ ...base, card: { elevation: "md" } });
    expect(light["--card-shadow"]).toContain("14px");
    expect(light["--card-image-ratio"]).toBeUndefined();
  });

  it("imageRatio e overlay", () => {
    const { light } = generateTheme({ ...base, card: { imageRatio: "square", overlay: true } });
    expect(light["--card-image-ratio"]).toBe("1 / 1");
    expect(light["--card-overlay"]).toBe("1");
  });

  it("overlay false/ausente não emite --card-overlay", () => {
    const { light } = generateTheme({ ...base, card: { overlay: false } });
    expect(light["--card-overlay"]).toBeUndefined();
  });
});

describe("generateTheme — hero (#350 Onda 4)", () => {
  it("sem hero.overlay não emite --hero-overlay (treatment é estrutura, não cor)", () => {
    const { light } = generateTheme({ ...base, hero: { treatment: "medallion" } });
    expect(light["--hero-overlay"]).toBeUndefined();
  });

  it("hero.overlay emite um scrim gradiente clampado a 90%", () => {
    const { light } = generateTheme({ ...base, hero: { treatment: "overlay", overlay: 55 } });
    expect(light["--hero-overlay"]).toContain("linear-gradient");
    expect(light["--hero-overlay"]).toContain("55%");
    const clamped = generateTheme({ ...base, hero: { overlay: 150 } }).light["--hero-overlay"];
    expect(clamped).toContain("90%");
  });
});
