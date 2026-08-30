import { describe, it, expect } from "vitest";
import { NICHE_THEMES, resolveThemeTokens, getNicheTheme, DEFAULT_THEME_ID } from "../index";

describe("catálogo de temas de nicho (#338)", () => {
  it("todo tema gera os tokens essenciais sem erro", () => {
    for (const t of NICHE_THEMES) {
      const tk = resolveThemeTokens(t);
      expect(tk["--brand-primary"], t.id).toBeTruthy();
      expect(tk["--brand-on-primary"], t.id).toBeTruthy();
      expect(tk["--surface-page"], t.id).toBeTruthy();
      expect(tk["--text-primary"], t.id).toBeTruthy();
      expect(tk["--font-family-display"], t.id).toBeTruthy();
    }
  });

  it("ids únicos no padrão theme-<skin>", () => {
    const ids = NICHE_THEMES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of NICHE_THEMES) expect(t.id).toBe(`theme-${t.skin}`);
  });

  it("mode dark → surface escura; light → surface clara", () => {
    expect(resolveThemeTokens(getNicheTheme("theme-tattoo")!)["--surface-page"]).toContain("900");
    expect(resolveThemeTokens(getNicheTheme("theme-padaria")!)["--surface-page"]).toContain("50");
  });

  it("radius: sharp/round emitem --radius-control; soft herda a base (não emite)", () => {
    expect(resolveThemeTokens(getNicheTheme("theme-tattoo")!)["--radius-control"]).toBe("0.25rem"); // sharp
    expect(resolveThemeTokens(getNicheTheme("theme-pet")!)["--radius-control"]).toBe("1rem");       // round
    expect(resolveThemeTokens(getNicheTheme("theme-padaria")!)["--radius-control"]).toBeUndefined(); // soft
  });

  it("DEFAULT_THEME_ID aponta pra temas que existem", () => {
    expect(getNicheTheme(DEFAULT_THEME_ID.light)).toBeTruthy();
    expect(getNicheTheme(DEFAULT_THEME_ID.dark)).toBeTruthy();
  });
});
