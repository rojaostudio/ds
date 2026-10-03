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

/**
 * rojao — navy + flare accent on zinc, Inter. The `rojao` brand of the Figma [RDS] (2.0).
 * text/heading is the primary (navy) on light, as in the [RDS] base collection: the logo pairs are navy and
 * orange, white and orange. The orange title is the Heading's tone=accent, not the default.
 */
export const rojao: BrandDef = {
  name: "rojao",
  description: "Brand Rojão. Navy + flare accent on zinc, Inter (Figma [RDS], brand rojao).",
  brand: {
    primary: "navy-900", secondary: "navy-900",
    accent: "flare-700",
  },
  surface: "zinc", text: "zinc",
  fonts: { body: "inter", display: "inter" },
};

export const recipes = { rojao } as const;
export type RecipeName = keyof typeof recipes;
