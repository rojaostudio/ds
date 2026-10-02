/**
 * themes/index.ts — catálogo de temas de NICHO (vitrine/Linkpage de lojistas).
 *
 * Temas que um lojista escolhe por nicho (padaria, barber…), consumidos em RUNTIME
 * via generateTheme (tokens inline na vitrine), NÃO como classes .theme-* estáticas.
 * Cada tema = recipe (BrandDef: cor + accent + surface + surfaceTint + fonte +
 * display + radius por papel) + mode claro/escuro FIXO. `tier` é negócio do consumidor.
 *
 * Onda 1: cor de marca + accent + surface ambientada + serif/sans.
 * Onda 2 (#341): fontes Jost/Nunito, display.transform (uppercase), radius por papel
 * (avatar/card/control + pill/square). Curadoria a partir do protótipo aprovado.
 */
import type { BrandDef, PaletteRef } from "../tokens/recipe.schema";
import { generateTheme, type TokenMap } from "../generate";

export type ThemeMode = "light" | "dark";

export type NicheTheme = {
  id: string;
  skin: string;
  name: string;
  niche: string;
  mode: ThemeMode;
  recipe: BrandDef;
};

function niche(
  skin: string,
  name: string,
  nicheLabel: string,
  mode: ThemeMode,
  recipe: Omit<BrandDef, "name" | "surface" | "text"> & { surface?: PaletteRef },
): NicheTheme {
  const { surface = "neutral", ...rest } = recipe;
  return {
    id: `theme-${skin}`,
    skin,
    name,
    niche: nicheLabel,
    mode,
    recipe: { name: skin, surface, text: "neutral", ...rest },
  };
}

const serif = { body: "inter", display: "instrument-serif", displayKind: "serif" } as const;
const sans = { body: "inter", display: "bricolage", displayKind: "sans" } as const;
const UPPER = { transform: "uppercase" } as const;

// Presets de arquétipo de template (Onda 4, #350) — card + hero + layout por família.
// EDITORIAL: foto grande, logo emoldurado, espaçoso (padaria/café/doceria/estética).
// PUNCH: card denso com overlay, hero com scrim sobre foto (barber/academia/tattoo).
// BOUTIQUE: minimalista, card flat retrato, hero flat (boutique/pet).
// MENU: cardápio/delivery — hero com scrim + card compacto (burger e afins).
// Neutros NÃO recebem preset: ficam no arquétipo "classic" (visual atual = fallback).
const EDITORIAL = { layout: "editorial", card: { elevation: "flat", imageRatio: "landscape" }, hero: { treatment: "medallion", logoFrame: "plate" } } as const;
const PUNCH = { card: { elevation: "md", imageRatio: "square", overlay: true }, hero: { treatment: "overlay", logoFrame: "badge", overlay: 55 } } as const;
const BOUTIQUE = { layout: "compact", card: { elevation: "flat", imageRatio: "portrait" }, hero: { treatment: "flat", logoFrame: "none" } } as const;
const MENU = { layout: "menu", card: { elevation: "sm", imageRatio: "square" }, hero: { treatment: "overlay", logoFrame: "badge", overlay: 50 } } as const;

export const NICHE_THEMES: NicheTheme[] = [
  // Neutros — default/backfill quando a loja não escolheu tema.
  niche("neutro-claro",  "Neutro Claro",  "Geral", "light", { brand: { primary: "#0a0a0a", accent: "#2563eb", secondary: "#525252" }, fonts: sans, radius: "soft" }),
  niche("neutro-escuro", "Neutro Escuro", "Geral", "dark",  { brand: { primary: "#0a0a0a", accent: "#3b82f6", secondary: "#525252" }, fonts: sans, radius: "soft", surface: "coal" }),

  // Nichos — cor/accent/surface/fonte/display/radius/gradiente do protótipo.
  niche("padaria",  "Aconchego",   "Padaria",             "light", {
    brand: { primary: "#d97706", accent: "#be123c", secondary: "#92400e" }, surface: "cream", surfaceGradient: 22, surfacePattern: "grain", fonts: serif, radius: "soft", ...EDITORIAL }),
  niche("doceria",  "Confeito",    "Doceria & Bolos",     "light", {
    brand: { primary: "#db2777", accent: "#f59e0b", secondary: "#9d174d" }, surfaceTint: 8, surfaceGradient: 22, surfacePattern: "soft-blobs", fonts: serif, radius: { avatar: "pill", card: "round", control: "pill" }, ...EDITORIAL }),
  niche("estetica", "Lumière",     "Estética & Beleza",   "light", {
    brand: { primary: "#b76e79", accent: "#c98b94", secondary: "#7c5560" }, surfaceTint: 8, surfaceGradient: 22, surfacePattern: "soft-blobs",
    fonts: { body: "jost", display: "instrument-serif", displayKind: "serif" }, radius: { avatar: "pill", card: "round", control: "pill" }, ...EDITORIAL }),
  niche("cafe",     "Torra",       "Cafeteria",           "light", {
    brand: { primary: "#6f4e37", accent: "#a87c4f", secondary: "#4a3526" }, surface: "cream", surfaceTint: 6, surfaceGradient: 12, surfacePattern: "grain", fonts: serif, radius: "soft", ...EDITORIAL }),
  niche("pet",      "Patinhas",    "Pet shop",            "light", {
    brand: { primary: "#14a3a3", accent: "#ff7a59", secondary: "#0e7490" }, surfaceTint: 8, surfaceGradient: 22, surfacePattern: "soft-blobs",
    fonts: { body: "nunito", display: "nunito", displayKind: "sans" }, radius: { avatar: "pill", card: "round", control: "round" }, ...BOUTIQUE }),
  niche("boutique", "Atelier",     "Moda & Boutique",     "light", {
    brand: { primary: "#111111", accent: "#0d9488", secondary: "#57534e" }, fonts: { body: "jost", display: "jost", displayKind: "sans" }, display: { transform: "uppercase", tracking: "wide" }, radius: "square", ...BOUTIQUE }),
  niche("barber",   "Brotherhood", "Barbearia",           "dark",  {
    brand: { primary: "#c9a45c", accent: "#b91c1c", secondary: "#8a6d3b" }, surface: "coal", surfaceGradient: 18, surfacePattern: "rays", fonts: sans, display: UPPER, radius: "soft", ...PUNCH }),
  niche("burger",   "Smash",       "Hamburgueria",        "dark",  {
    brand: { primary: "#ff3b30", accent: "#ffb703", secondary: "#b91c1c" }, surface: "coal", surfaceTint: 6, surfaceGradient: 18, surfacePattern: "rays", fonts: sans, display: UPPER, radius: { avatar: "soft", card: "round", control: "pill" }, ...MENU }),
  // PILOTO de tema PREMIUM bespoke (skin layer). Identidade de FOGO: brand
  // vermelho-fogo + accent laranja sobre coal, display punchy (Bricolage) caixa-alta,
  // rays no fundo e hero overlay forte (scrim 60). O DS continua AGNÓSTICO: gera só os
  // tokens; a arte/CSS de hambúrguer (gradiente quente, glow, slot de ilustração) mora
  // numa camada de skin do produto, injetada por cima quando a conta usa esta identidade.
  niche("brasa-pop","Brasa Pop",   "Hamburgueria",        "dark",  {
    brand: { primary: "#dc2626", accent: "#f97316", secondary: "#991b1b" }, surface: "coal", surfaceTint: 8, surfaceGradient: 24, surfacePattern: "rays",
    fonts: { body: "inter", display: "bricolage", displayKind: "sans" }, display: UPPER, radius: { avatar: "soft", card: "round", control: "pill" }, darkenFill: true, ...PUNCH }),
  niche("academia", "Forja",       "Academia & CrossFit", "dark",  {
    brand: { primary: "#c6ff00", accent: "#06b6d4", secondary: "#4d7c0f" }, surface: "coal", surfaceGradient: 18, surfacePattern: "rays", fonts: sans, display: UPPER, radius: { avatar: "square", card: "sharp", control: "square" }, ...PUNCH }),
  // #350 Fase 5: tattoo era #d22b2b (vermelho) e colidia com o burger #ff3b30 —
  // "dois vermelhos dark+coal+uppercase". Vira MONO ("Black Ink" fiel ao nome): primary
  // neutra → no dark a marca inverte pra branco sobre coal. Distinta do burger por
  // cor (mono×vermelho) e dos neutros por serif+uppercase+grain+sharp.
  niche("tattoo",   "Black Ink",   "Estúdio de tatuagem", "dark",  {
    brand: { primary: "#0a0a0a", accent: "#e11d48", secondary: "#525252" }, surface: "coal", surfaceGradient: 18, surfacePattern: "grain", fonts: serif, display: UPPER, radius: { avatar: "square", card: "sharp", control: "sharp" }, ...PUNCH }),

  // #350 — nichos de comida/delivery (arquétipo MENU): o burger não podia ser o único.
  // Cores espaçadas em matiz por modo pra passar o lint de catálogo (sem colisão).
  niche("hotdog",   "Dog Club",    "Hot dog & Food truck", "dark",  {
    brand: { primary: "#2563eb", accent: "#facc15", secondary: "#1e40af" }, surface: "coal", surfaceTint: 5, surfaceGradient: 18, surfacePattern: "rays", fonts: sans, display: UPPER, radius: { avatar: "soft", card: "round", control: "pill" }, ...MENU }),
  niche("ramen",    "Nori Club",   "Ramen & Street food",  "dark",  {
    brand: { primary: "#16a34a", accent: "#facc15", secondary: "#15803d" }, surface: "coal", surfaceTint: 5, surfaceGradient: 18, surfacePattern: "rays", fonts: sans, display: UPPER, radius: { avatar: "soft", card: "round", control: "pill" }, ...MENU }),
  niche("pizzaria", "Sapore",      "Pizzaria",             "light", {
    brand: { primary: "#d62828", accent: "#0a7d33", secondary: "#9d1717" }, surface: "cream", surfaceTint: 5, surfaceGradient: 18, surfacePattern: "grain", fonts: serif, radius: "soft", ...MENU }),
  niche("sorveteria","Gelato",     "Sorveteria & Açaí",    "light", {
    brand: { primary: "#7c3aed", accent: "#f472b6", secondary: "#5b21b6" }, surfaceTint: 8, surfaceGradient: 22, surfacePattern: "soft-blobs",
    fonts: { body: "nunito", display: "nunito", displayKind: "sans" }, radius: { avatar: "pill", card: "round", control: "round" }, ...MENU }),
  niche("floricultura","Verdejante","Floricultura",        "light", {
    brand: { primary: "#4d7c4d", accent: "#d98cb3", secondary: "#3d633d" }, surfaceTint: 6, surfaceGradient: 18, surfacePattern: "soft-blobs", fonts: serif, radius: { avatar: "pill", card: "round", control: "soft" }, ...EDITORIAL }),
];

/** id do tema neutro default por modo — fallback quando a loja não escolheu nenhum. */
export const DEFAULT_THEME_ID: Record<ThemeMode, string> = {
  light: "theme-neutro-claro",
  dark: "theme-neutro-escuro",
};

export function getNicheTheme(id: string): NicheTheme | undefined {
  return NICHE_THEMES.find((t) => t.id === id);
}

/**
 * Tokens finais do tema, conforme o `mode` FIXO. generateTheme devolve `dark` como
 * DIFF sobre o light; pra um tema escuro fundimos os dois. O consumidor injeta inline.
 */
export function resolveThemeTokens(theme: NicheTheme): TokenMap {
  const { light, dark } = generateTheme(theme.recipe);
  return theme.mode === "dark" ? { ...light, ...dark } : light;
}
