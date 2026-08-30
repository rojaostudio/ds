/**
 * recipes/index.ts — as receitas PÚBLICAS do design system.
 *
 * SPEC EXECUTÁVEL: generateTheme(def) deve reproduzir cada styles/themes/<name>.css.
 * Harness: pnpm validate:themes.
 *
 * As receitas de marca de produto e de cliente NÃO vivem aqui: uma receita é a cor da
 * marca, e publicá-la num registry público vaza o mesmo que publicar o tema. Elas ficam
 * em `private/brands.ts`, fora do `files[]` e fora do repositório público.
 * Ver rojao-ds#101.
 *
 * O catálogo de presets genéricos (nicho → paleta) continua público, em `themes/index.ts`:
 * ele não descreve marca de ninguém, descreve ponto de partida.
 */
import type { BrandDef } from "../tokens/recipe.schema";

/** rojao — neutro preto + accent green, Inter. */
export const rojao: BrandDef = {
  name: "rojao",
  description: "Brand Rojão (loja). Neutro preto + accent green, Inter.",
  brand: {
    primary: "neutral-900", hover: "neutral-700", onPrimary: "white",
    secondary: "white", onSecondary: "neutral-900",
    accent: "green-500", accentLight: "green-50", onAccent: "white",
  },
  surface: "neutral", text: "neutral",
  fonts: { body: "inter", display: "inter" },
};

export const recipes = { rojao } as const;
export type RecipeName = keyof typeof recipes;
