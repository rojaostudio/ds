/**
 * recipe.schema.ts — contrato de input do gerador de tema (Fase 1).
 *
 * Um BrandDef + as regras de derivação da base.css produzem deterministicamente
 * um theme.css. Os 6 temas atuais (styles/themes/*.css) passam a ser OUTPUT
 * destes BrandDef. Ver docs/fase1-gerador-tema.md e issue #12.
 *
 * Princípio: o BrandDef captura só DECISÃO DE MARCA. Tudo que é fórmula
 * (surfaces, text, borders, soft-states) o gerador deriva por tabela do arquétipo.
 */

/** Referência a cor: "<palette>-<step>" | keyword | hex | expressão color-mix literal. */
export type ColorRef = string;
// ex: "teal-500" → var(--color-teal-500) · "white" → var(--color-white)
//     "#0A0A0A" → literal (precisa allowLiteral) · "mix(white 82%, cream-900)" → color-mix literal

/** Paleta primitiva (escala 50–900) disponível em tokens/index.ts. */
export type PaletteRef =
  | "neutral" | "zinc" | "cream" | "coal"
  | "red" | "green" | "blue" | "teal" | "amber" | "purple" | "orange"
  | "cobalt" | "brick" | "moss" | "clay" | "flare"
  | "ash" | "ember" | "navy";

// Natureza da marca. NÃO é mais decisão: o motor DERIVA da saturação da primary
// (isNeutralBrand em generate/scale.ts). Permanece só como OVERRIDE opcional de
// borda — uma marca pastel que você queira forçar pra um lado.
// O antigo "mix" virou scaleMode: "mix" (algoritmo de geração, só studio).
export type Archetype =
  | "neutral"    // brand = preto/branco; accent à parte; brand INVERTE no dark
  | "chromatic"; // brand = cor; surfaces neutras; brand CLAREIA no dark p/ manter contraste

export type DarkStrategy = "invert" | "lighten" | "mix";

export type FontDef = {
  /** nome da var sem prefixo: "inter" → var(--font-inter). */
  body: string;
  display?: string;       // ausente → colapsa no body
  editorial?: string;
  mono?: string;
  /** fallback do display. default: "sans". */
  displayKind?: "sans" | "serif";
};

/** Text styles semânticos editáveis (espelham os --font-size-* da base.css). */
export type TextStyleName =
  | "caption" | "label" | "body"
  | "button-sm" | "button-md" | "button-lg"
  | "heading-sm" | "heading-md" | "heading-lg";

/** Steps da escala de tamanho primitiva (o ramp). O único lugar com px cru. */
export type ScaleToken = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";

/** Override de um text style: aponta pra um token da escala (nunca px solto). */
export type TextStyle = { token?: ScaleToken };

/** Type scale per-brand — cada text style referencia um token de tamanho. */
export type TypeScale = Partial<Record<TextStyleName, TextStyle>>;

/** Arredondamento do tema. "soft" = default da base (8px); "pill" = 9999; "square" = 0. */
export type RadiusScale = "sharp" | "soft" | "round" | "pill" | "square";

/** Radius por papel — controle/botão, card/superfície e avatar variam independente. */
export type RadiusByRole = { control?: RadiusScale; card?: RadiusScale; avatar?: RadiusScale };

/** Voz do display (nome/títulos) além da fonte — uppercase, tracking. */
export type DisplayStyle = { transform?: "uppercase"; tracking?: "wide" };

// ─── Arquétipo de template (Onda 4, #350) ──────────────────────────────────────
// Eixo de TEMPLATE além de tokens: os temas deixam de ser "a mesma página repintada"
// e ganham fundo/card/hero/layout próprios por nicho. Tudo opt-in e diff-clean: um
// recipe sem estes campos gera o visual atual byte a byte (arquétipo "classic").

/** Textura sutil no fundo da vitrine (--surface-texture). Ausente/'none' = limpo. */
export type SurfacePattern = "dots" | "grain" | "rays" | "soft-blobs" | "none";

/** Estilo dos cards de produto/destaque — sombra, proporção da imagem, overlay de texto. */
export type CardStyle = {
  elevation?: "flat" | "sm" | "md";              // --card-shadow
  imageRatio?: "square" | "portrait" | "landscape"; // --card-image-ratio
  overlay?: boolean;                              // texto sobre a imagem (--card-overlay)
};

/** Tratamento do hero da vitrine — o maior diferencial visual entre arquétipos. */
export type HeroStyle = {
  /** estrutura do hero; lida pelo consumidor como data-hero. 'flat' = banner atual. */
  treatment?: "flat" | "overlay" | "medallion" | "split";
  /** moldura do logo no hero; data-logo-frame no consumidor. */
  logoFrame?: "none" | "badge" | "plate";
  /** intensidade do scrim sobre a foto do hero (%) → --hero-overlay. */
  overlay?: number;
};

/** Template estrutural da vitrine. 'classic'/ausente = composição atual byte a byte. */
export type LayoutArchetype = "classic" | "editorial" | "compact" | "menu";

/** Escala completa de uma paleta: step (50…900) → hex. */
export type PaletteScale = Record<string, string>;

export type BrandColors = {
  primary: ColorRef;
  hover?: ColorRef;        // ausente → derivado (±steps pela regra do arquétipo)
  onPrimary?: ColorRef;    // ausente → resolvido por contraste (white vs near-black)
  secondary?: ColorRef;
  onSecondary?: ColorRef;
  accent?: ColorRef;
  accentLight?: ColorRef;  // ausente → color-mix(accent 12-15%, transparent)
  onAccent?: ColorRef;
  borderFocus?: ColorRef;  // ausente → neutral: N-900 | chromatic: primary
};

export type BrandDef = {
  /** → seletor .theme-<name> */
  name: string;
  description?: string;
  /**
   * OPCIONAL — override da natureza derivada (isNeutralBrand mede a saturação da
   * primary). Omita: o motor mede. Cuidado: o valor não afeta SÓ o focus ring —
   * 'neutral' também dispara a INVERSÃO da brand no dark (primary→branco). Use só
   * pra forçar um caso de borda (pastel dessaturado-mas-colorido) que a medição erra.
   */
  archetype?: Archetype;
  /** "ref" (usa paletas existentes) | "mix" (color-mix sobre âncoras → mixTheme). default "ref". */
  scaleMode?: "ref" | "mix";
  /** permite cor literal (hex/keyword cru) no output — só p/ mono puro (studio). */
  allowLiteral?: boolean;
  /** opt-in (%): mistura um traço da brand-primary nas superfícies (page/default/
   *  raised) — a marca pinta o ambiente, não só os botões. Off (curados) = neutro. */
  surfaceTint?: number;
  /** opt-in (%): aura radial da brand no topo do fundo (--surface-gradient). 0/ausente
   *  = sem gradiente. ~22 = assinatura padrão; boutique=0; café atenuado (#341). */
  surfaceGradient?: number;
  /** opt-in: primary clara demais p/ texto branco → escurece o fill pro mesmo matiz
   *  mais profundo (branco legível e brandado, em vez de texto preto mecânico). */
  darkenFill?: boolean;

  brand: BrandColors;

  /**
   * Paletas custom da marca. Cada valor é:
   *  - um hex (#rrggbb) → o motor deriva a escala 50–900 (buildScale, #28), ou
   *  - uma escala completa { "50": "#…", …, "900": "#…" } → emitida como-está
   *    (usada na migração das paletas legadas, que têm curva curada à mão).
   * Emite --color-<nome>-<step>. NÃO fazem parte do core — cada marca tem as suas.
   */
  palettes?: Record<string, string | PaletteScale>;

  /**
   * Type scale per-brand — overrides parciais sobre os text styles semânticos
   * da base (--font-size-*). Ausente → herda o default da base.css. v1: só size.
   * Emite só o que foi customizado, então recipes sem `type` ficam diff-clean.
   */
  type?: TypeScale;

  /**
   * Dois eixos neutros independentes (o padrão real do sistema):
   * - surface: page / default / raised. (overlay usa o text-900.)
   * - text:    text-* / border-* / icon.
   * Caso simples: surface === text. Ex.: surface=cream, text=neutral.
   * um produto consumidor: surface=zinc(light)/coal(dark), text=zinc. (substitui o antigo surfaceTint.)
   */
  surface: PaletteRef;
  text: PaletteRef;

  fonts: FontDef;

  /** Voz do display (nome/títulos): uppercase + tracking. Ausente → herda a base. */
  display?: DisplayStyle;

  /**
   * Arredondamento. Aceita um nível único (aplica a tudo) OU por papel
   * ({ control, card, avatar }). Ausente/"soft" → herda a base (8px), diff-clean.
   * Emite --radius-control/card/avatar/tooltip/toast. O badge é sempre pill.
   */
  radius?: RadiusScale | RadiusByRole;

  // ─── Arquétipo de template (Onda 4, #350) — todos opt-in, diff-clean ───────────
  /** Textura do fundo da vitrine → --surface-texture (+ --surface-texture-size). */
  surfacePattern?: SurfacePattern;
  /** Estilo dos cards → --card-shadow / --card-image-ratio / --card-overlay. */
  card?: CardStyle;
  /** Tratamento do hero → --hero-overlay (valor) + data-hero/data-logo-frame (estrutura). */
  hero?: HeroStyle;
  /** Template estrutural da vitrine → data-template no consumidor. */
  layout?: LayoutArchetype;

  dark?: {
    /** default decorre do arquétipo (neutral→invert, chromatic→lighten, mix→mix). */
    strategy?: DarkStrategy;
    /** overrides explícitos do brand no dark (ex: chromatic clareado p/ teal-400). */
    brand?: Partial<BrandColors>;
    /** eixos no dark — default = os do light. ex: uma marca cream→neutral, um produto consumidor zinc→coal. */
    surface?: PaletteRef;
    text?: PaletteRef;
  };

  /**
   * Tokens de componente específicos (shell, choice-card, selection, tooltip…).
   * v1 NÃO gera — passthrough/patch. Ver issue #12 (v2).
   */
  extras?: Record<string, { light?: string; dark?: string }>;
};
