/**
 * generate/index.ts — superfície pública do motor de tema (Fase 1, issue #12).
 * O app gerador (ds.rojao.ai) consome daqui: BrandDef → tokens → theme.css.
 */
export { generateTheme, resolveTheme } from "./generateTheme";
export type { TokenMap, GenResult, ResolvedTheme } from "./generateTheme";
export { emitCss } from "./emitCss";
export { emitClaudeMd } from "./emitClaudeMd";
export type { ClaudeMdTarget, ClaudeMdOptions } from "./emitClaudeMd";
export type {
  BrandDef,
  BrandColors,
  PaletteRef,
  Archetype,
  ColorRef,
  FontDef,
  DarkStrategy,
  TextStyleName,
  TextStyle,
  TypeScale,
  ScaleToken,
} from "../tokens/recipe.schema";

// Cor de marca custom (#28): deriva escala 50–900 + contraste a partir de 1 hex.
// Consumido em runtime (ex.: aplicar a cor de uma marca numa página pública).
export {
  buildScale,
  brandTones,
  onColor,
  contrastRatio,
  relativeLuminance,
  hexToHsl,
  hslToHex,
  isHex,
  isNeutralBrand,
  // refToHex resolve "neutral-500" → hex. Estava só no arquivo e o barril não expunha; com a
  // #99 os testes passam a importar pelo nome do pacote, e o que não está no barril não existe.
  refToHex,
  SCALE_STEPS,
} from "./scale";
export type { Scale, ScaleStep } from "./scale";
