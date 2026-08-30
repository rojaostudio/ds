/**
 * generateTheme.ts — motor puro do gerador de tema (Fase 1, issue #12).
 *
 * BrandDef → tokens semânticos (light + dark) por dois eixos neutros:
 *   surface (page, default, raised, overlay) vs text (text, border, icon).
 * Caso simples = surface === text. Cobre "neutral" e "chromatic"; "mix" = v2.
 *
 * Dark: bloco só contém vars que MUDAM vs light (CSS cascade). Surfaces/text
 * vêm dos eixos dark (override) ou herdam o light. Bordas dark = white-alpha
 * canônico 8/14/22 (canonicaliza drift de zinc-alpha herdado).
 */
import type { BrandDef, ColorRef, PaletteRef, RadiusScale, SurfacePattern } from "../tokens/recipe.schema";
import { isHex, brandTones, hoverRef, onColorRef, buildScale, SCALE_STEPS, isNeutralBrand, contrastRatio, refToHex, relativeLuminance, hexToHsl, hslToHex, type ScaleStep } from "./scale";

export type TokenMap = Record<string, string>;
export type GenResult = { supported: boolean; light: TokenMap; dark: TokenMap; note?: string };

const step = (p: PaletteRef, n: number) => `var(--color-${p}-${n})`;

function ref(c: ColorRef, allowLiteral = false): string {
  const mix = c.match(/^mix\((.+)\)$/);
  if (mix) {
    const [aPart, bPart] = mix[1].split(",").map((s) => s.trim());
    const a = aPart.match(/^(.+?)\s+(\d+%)$/);
    const aStr = a ? `${ref(a[1], allowLiteral)} ${a[2]}` : ref(aPart, allowLiteral);
    const bStr = bPart === "transparent" ? "transparent" : ref(bPart, allowLiteral);
    return `color-mix(in srgb, ${aStr}, ${bStr})`;
  }
  if (c.startsWith("#")) return c;
  return `var(--color-${c})`;
}

const alpha = (pct: number) => `color-mix(in srgb, var(--color-white) ${pct}%, transparent)`;

// Surface representativa por modo, pra cravar um tom de marca SEMPRE visível.
const SURF: Record<"light" | "dark", string> = { light: "#ffffff", dark: "#0a0a0a" };

/**
 * Tom-por-papel (lição do Material): a cor de marca NUNCA vai crua pra um papel de
 * superfície (borda/foco/stroke). Se a cor já contrasta com a surface do modo
 * (>= min), mantém — preserva a escolha do usuário. Senão crava no step de papel
 * FIXO (600 escuro no light, 300 claro no dark) da própria escala, preservando o
 * matiz. Determinístico, sem medir-e-empurrar. Só hex custom (curados são ColorRef).
 */
function surfaceSafeHex(hex: string, mode: "light" | "dark", min = 3): string {
  const bg = SURF[mode];
  if (contrastRatio(hex, bg) >= min) return hex;
  const scale = buildScale(hex);
  const order: ScaleStep[] = mode === "light" ? [600, 700, 800, 900] : [300, 200, 100, 50];
  for (const s of order) if (contrastRatio(scale[s], bg) >= min) return scale[s];
  return mode === "light" ? scale[900] : scale[50];
}

// Affordance do FILL da marca. A cor da marca é literal (intenção do lojista, pode até ser a
// mesma cor do fundo), mas um botão cujo fill "encosta" na superfície perde a borda visível e
// some no fundo. Em vez de mexer na COR, emitimos um hairline translúcido: o motor devolve a
// borda SÓ quando o fill quase não contrasta com a página (abaixo de FILL_AFFORDANCE_MIN);
// acima disso a própria cor delimita e a borda fica transparent (fallback do CSS no botão). A
// cor da borda é o on-primary a 60% — ele contrasta com o fill por construção e, justamente
// porque o fill ≈ superfície no caso que dispara, também descola da página. Refs irresolúveis
// (paleta custom) → sem borda (tema hand-tuned decide). fillRef pode ser hex ou ColorRef.
const FILL_AFFORDANCE_MIN = 2;
function primaryFillBorder(fillRef: string, surfaceRef: string): string | null {
  const fill = isHex(fillRef) ? fillRef : refToHex(fillRef);
  const surf = refToHex(surfaceRef);
  if (!fill || !surf) return null;
  if (contrastRatio(fill, surf) >= FILL_AFFORDANCE_MIN) return null;
  return "color-mix(in srgb, var(--brand-on-primary) 60%, transparent)";
}

const isSerif = (name?: string) => !!name && /serif/.test(name);
/** Fallback da família: serif se a fonte é serif (ou displayKind o força). */
const familyFb = (name: string | undefined, kind?: "sans" | "serif") =>
  kind === "serif" || isSerif(name) ? "Georgia, serif" : "system-ui, sans-serif";

function fonts(def: BrandDef): TokenMap {
  const f = def.fonts;
  const out: TokenMap = { "--font-family": `var(--font-${f.body}), system-ui, sans-serif` };
  const disp = f.display ?? f.body;
  out["--font-family-display"] = `var(--font-${disp}), ${familyFb(disp, f.displayKind)}`;
  if (f.editorial) out["--font-family-editorial"] = `var(--font-${f.editorial}), ${familyFb(f.editorial)}`;
  if (f.mono) out["--font-family-mono"] = `var(--font-${f.mono}), 'Courier New', monospace`;
  return out;
}

// on-<color>: explícito vence; senão deriva por contraste WCAG (hex ou ref de
// paleta); fallback branco. É a "regra matemática" — o usuário escolhe só a cor.
function onOf(explicit: ColorRef | undefined, color: ColorRef, lit: boolean): string {
  if (explicit) return ref(explicit, lit);
  return ref(onColorRef(color) ?? "white", lit);
}

// Stipple da marca (radial-gradient) usado nas faixas/hero de identidade das faces (vitrine + Bio).
// A cor do ponto deriva de --brand-on-secondary a 14% — mesma receita histórica, agora dona do motor.
const SECONDARY_DOTS =
  "radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--brand-on-secondary) 14%, transparent) 1px, transparent 0)";
const SECONDARY_TEXTURE_SIZE = "18px 18px";

// O stipple só lê como TEXTURA quando a secondary tem CROMA *e* LUMINÂNCIA pra sustentá-lo. Sobre um
// verde/roxo saturado de tom médio é um respingo de luz agradável; sobre uma secondary quase-preta
// (ou quase-branca) o mesmo stipple vira grão/ruído. Mede a PRÓPRIA secondary (não o brand): um tema
// pode ter primary cromática e secondary neutra (academia dark: lime + quase-preto).
//
// Por que NÃO basta a saturação HSL: em luminância baixíssima a saturação HSL EXPLODE (um
// #0C0C04 = canais 12/12/4 dá ~50% de saturação, mas é preto perceptual). Então exigimos também
// uma janela de luminância relativa (WCAG): fora dela, por mais "saturado" que o HSL diga, é grão.
const TEXTURE_SAT_MIN = 20;   // saturação HSL mínima (abaixo = neutro/P&B)
const TEXTURE_LUM_MIN = 0.03; // relLum mínima (abaixo = quase-preto: stipple vira grão)
const TEXTURE_LUM_MAX = 0.85; // relLum máxima (acima = quase-branco: stipple vira sujeira)

// Uma secondary "cromática" = croma real E dentro da janela de luminância. Vale pra DUAS decisões:
// (1) texturizar (stipple sustenta) e (2) clarear no dark (não amplifica matiz virando mud).
// refToHex irresolúvel (paleta custom) → true, conservando o comportamento antigo.
function isChromaticSurface(secRef: string | null): boolean {
  const hex = secRef ? refToHex(secRef) : null;
  if (!hex) return true;
  const [, s] = hexToHsl(hex);
  const l = relativeLuminance(hex);
  return s > TEXTURE_SAT_MIN && l >= TEXTURE_LUM_MIN && l <= TEXTURE_LUM_MAX;
}

function secondaryTexture(secRef: string | null): TokenMap {
  return {
    "--brand-secondary-texture": isChromaticSurface(secRef) ? SECONDARY_DOTS : "none",
    "--brand-secondary-texture-size": SECONDARY_TEXTURE_SIZE,
  };
}

// DS-2 (#27) — escala de marca canônica `--brand-primary-50..900`. Mata a necessidade de o
// consumidor reimplementar uma paleta OKLCH por fora: o motor já deriva a
// escala. Hex → buildScale; ref de paleta (`coal-900`) → aponta pra `--color-<paleta>-<step>`.
// Emitida só no LIGHT (é a paleta da marca, primitivo — igual nos dois modos via cascade).
function brandScale(primary: ColorRef): TokenMap {
  const o: TokenMap = {};
  if (isHex(primary)) {
    const scale = buildScale(primary);
    for (const s of SCALE_STEPS) o[`--brand-primary-${s}`] = scale[s];
    return o;
  }
  const m = primary.match(/^([a-zA-Z]+)-\d+$/);
  if (m) for (const s of SCALE_STEPS) o[`--brand-primary-${s}`] = `var(--color-${m[1]}-${s})`;
  return o;
}

// DS-4 (#29) — derivação HARMÔNICA de secondary/accent quando o recipe não os traz. Contraste
// técnico ≠ harmonia (Gabi): o motor deriva pela roda de cor a partir da primary, com clamp de
// saturação/luminância pra não sair neon berrante nem lama dessaturada. secondary = análoga (hue
// +28°, apoio da mesma família); accent = split-complementar (hue +170°, a faísca < 10% de área).
// Só entra com primary HEX custom (override do lojista) — refs de paleta curados trazem os 3 papéis
// à mão e seguem intactos. Preserva o HUE da marca; identidade mantida (roda de cor, não aleatório).
function deriveHarmony(primaryHex: string): { secondary: string; accent: string } {
  // hexToHsl/hslToHex operam em S,L ∈ [0,100] (percentual), não [0,1].
  const [h, s, l] = hexToHsl(primaryHex);
  const clampS = (x: number) => Math.min(72, Math.max(35, x));
  const clampL = (x: number) => Math.min(60, Math.max(42, x));
  return {
    secondary: hslToHex((h + 28) % 360, clampS(s * 0.9), clampL(l)),
    accent: hslToHex((h + 170) % 360, clampS(s), clampL(l)),
  };
}

function brandLight(def: BrandDef, lit: boolean): TokenMap {
  const b = def.brand;
  const o: TokenMap = {};
  // #27 — escala da marca (aditivo): --brand-primary-50..900 derivada da cor crua.
  Object.assign(o, brandScale(b.primary));
  // A cor da marca é INTENÇÃO do lojista → emitida LITERAL, nunca reancorada pra
  // contrastar com a superfície. Se ele escolhe #000, o fill é #000 (mesma cor do
  // fundo se ele quiser). O contraste é responsabilidade de OUTROS papéis: o par
  // on-primary (texto sobre o fill, derivado por WCAG abaixo) e --brand-text (marca
  // usada como texto sobre a página, reancorada em light()). O motor garante o
  // contraste do TEXTO, não sequestra a escolha de cor. Curado (ColorRef) idem literal.
  const primary = b.primary;
  o["--brand-primary"] = ref(primary, lit);
  // Deriva hover/on-primary que o recipe não trouxe (escala + contraste WCAG).
  // Hex: brandTones (#28). Ref de paleta: hoverRef/onColorRef (#13). Valores
  // explícitos do recipe sempre vencem — curados seguem byte-idênticos.
  const tones = isHex(primary) ? brandTones(primary) : null;
  if (b.hover) o["--brand-hover"] = ref(b.hover, lit);
  else if (tones) o["--brand-hover"] = tones.hover;
  else {
    const h = hoverRef(b.primary);
    if (h) o["--brand-hover"] = ref(h, lit);
  }
  o["--brand-on-primary"] = b.onPrimary ? ref(b.onPrimary, lit)
    : tones ? tones.on
    : ref(onColorRef(primary) ?? "white", lit);
  if (b.secondary) {
    o["--brand-secondary"] = ref(b.secondary, lit);
    o["--brand-on-secondary"] = onOf(b.onSecondary, b.secondary, lit);
    // Superfície da BANDA de identidade (vitrine: header full-bleed que segura logo+nome+ações). No
    // LIGHT é sempre a cor da marca. Emitido explícito (mesmo = brand) pra o inline no #store-wrapper
    // GANHAR da cascata (o tema global do admin também define este token; sem o inline uma loja light
    // herdaria o valor errado e a banda vazava clara).
    o["--brand-secondary-surface"] = "var(--brand-secondary)";
    // BANDA DECORATIVA da Bio (faixa acima do card, sem conteúdo). No light é a cor da marca; ver
    // darkFull pro caso neutro-dark, onde ela vira 'transparent' pra deixar a página (bolinhas +
    // spotlight) aparecer através dela.
    o["--brand-secondary-band"] = "var(--brand-secondary)";
    Object.assign(o, secondaryTexture(b.secondary));
  }
  if (b.accent) {
    o["--brand-accent"] = ref(b.accent, lit);
    if (b.accentLight) o["--brand-accent-light"] = ref(b.accentLight, lit);
    o["--brand-on-accent"] = onOf(b.onAccent, b.accent, lit);
  }
  return o;
}

function light(def: BrandDef): TokenMap {
  const S = def.surface, T = def.text, b = def.brand, lit = !!def.allowLiteral;
  // ink = âncora escura do tema (a paleta das superfícies dark). Quando não há
  // dark.surface próprio, ink === text. É a tinta do scrim/overlay e do texto.
  const ink = def.dark?.surface ?? T;
  const o: TokenMap = { ...fonts(def), ...brandLight(def, lit) };

  // Surface — overlay = scrim escuro (âncora ink). surfaceTint (opt-in, %): mistura
  // um traço da brand nas superfícies pra a marca pintar o AMBIENTE, não só os
  // botões (padaria cremosa, café amarronzado). Sem o flag → neutro chapado (curados).
  // Cap em 10%: acima disso a surface se aproxima da marca e elementos brigam.
  const tintPct = def.surfaceTint ? Math.min(def.surfaceTint, 10) : undefined;
  const tint = (base: string) =>
    tintPct ? `color-mix(in srgb, ${ref(b.primary, lit)} ${tintPct}%, ${base})` : base;
  o["--surface-page"] = tint(step(S, 50));
  o["--surface-default"] = tint("var(--color-white)");
  o["--surface-raised"] = tint(step(S, 100));
  o["--surface-overlay"] = step(ink, 900);
  // Superficie INVERTIDA (item selecionado de ToggleGroup, chip ativo): forma par com
  // --text-inverse e so existia num tema, via extras. O base.css exporta o utilitario
  // (--color-surface-invert) mas nenhum tema neutro/chromatic definia a origem, entao
  // `bg-surface-invert` nao pintava nada e o par dava 1:1 — branco sobre transparente.
  // Ver rojao-ds#93. Extras de tema continuam sobrescrevendo (applyExtras roda depois).
  o["--surface-invert"] = step(ink, 900);

  // Border — subtle segue surface quando difere; default/strong no text
  o["--border-subtle"] = S !== T ? step(S, 200) : step(T, 100);
  o["--border-default"] = step(T, 200);
  o["--border-strong"] = step(T, 300);
  // Borda de CONTROLE (campo, caixa, seletor): a WCAG 1.4.11 pede 3:1 pra o que identifica um
  // componente de interface, e a borda é o que delimita um campo vazio. As três acima são
  // decoração (separador, card) e ficam sutis de propósito; esta não pode. neutral-400 dá 2.92
  // sobre o branco — falha por um triz —, então o piso é o 500. Ver rojao-ds#87.
  o["--border-control"] = step(T, 500);
  o["--border-focus"] = b.borderFocus
    ? ref(b.borderFocus, lit)
    : isNeutralBrand(def) ? step(T, 900)
    : isHex(b.primary) ? surfaceSafeHex(b.primary, "light") // tom-por-papel, nunca cru
    : ref(b.primary, lit);

  // Cor de marca legível como TEXTO sobre a surface. Mantém a cor CRUA (vibrante)
  // quando ela já contrasta (min 3 = piso seguro p/ preço bold/grande); só crava no
  // tom de papel quando a marca realmente some (ex: neutro-escuro #0a0a0a sobre dark).
  // Preserva o matiz — vibrante onde dá, ajusta só onde quebra de verdade.
  o["--brand-text"] = isNeutralBrand(def) ? step(T, 900)
    : isHex(b.primary) ? surfaceSafeHex(b.primary, "light")
    : ref(b.primary, lit);

  // Affordance do fill: hairline no botão só quando a marca encosta na página clara.
  const pb = primaryFillBorder(b.primary, `${S}-50`);
  if (pb) o["--brand-primary-border"] = pb;

  // Text + Icon — tinta principal = ink; inverse = near-white do text quando
  // a tinta difere do neutro de texto (dark-first), senão branco puro.
  o["--text-primary"] = step(ink, 900);
  o["--text-secondary"] = step(T, 700);
  // Mesma correcao do escuro, agora no claro (#109): a --surface-raised (neutral-100) e a
  // MAIS ESCURA das tres superficies claras, e e ela quem manda. Sobre #ededed o 500 da 4.05 e
  // reprova por pouco; o 600 da 6.17. Abaixo do secondary (700) o 600 e o UNICO degrau que
  // passa, entao o placeholder aterrissa no mesmo tom — a escada do claro tem tres niveis, nao
  // quatro. Colapso aceito de proposito: muted e placeholder sao ambos texto de baixa enfase
  // que precisa ser LIDO. O disabled fica no 400 porque a WCAG 1.4.3 dispensa componente
  // desabilitado — e o unico dos quatro que pode ficar abaixo do piso.
  o["--text-muted"] = step(T, 600);
  o["--text-disabled"] = step(T, 400);
  o["--text-inverse"] = ink !== T ? step(T, 100) : "var(--color-white)";
  o["--text-placeholder"] = step(T, 600); // conteudo, nao e isento: 2.80/2.92/2.49 no 400
  o["--icon-default"] = step(T, 800);
  return o;
}

function darkFull(def: BrandDef): TokenMap {
  const Sd = def.dark?.surface ?? def.surface;
  const Td = def.dark?.text ?? def.text;
  const ink = def.dark?.surface ?? def.text;
  const lit = !!def.allowLiteral;
  const o: TokenMap = {};

  o["--surface-page"] = step(Sd, 900);
  o["--surface-default"] = step(Sd, 800);
  o["--surface-raised"] = step(Sd, 700);
  o["--surface-overlay"] = step(Sd, 200);
  // No escuro o "invertido" e a ancora CLARA — senao o invertido seria a propria pagina.
  // Par com --text-inverse (= step(ink, 900)). Ver rojao-ds#93.
  o["--surface-invert"] = step(Td, 50);

  o["--border-subtle"] = alpha(8);
  o["--border-default"] = alpha(14);
  o["--border-strong"] = alpha(22);
  o["--border-control"] = alpha(40); // 3.71 sobre a surface escura (22% daria 2.0)

  o["--text-primary"] = step(Td, 50);
  // A escala de texto do escuro tem que ser calibrada contra --surface-raised (neutral-700,
  // o tom MAIS CLARO das tres superficies), nao contra a pagina. Sobre neutral-700 so
  // 100/200/300 alcancam os 4.5:1 da WCAG 1.4.3: o 400 da 3.78 e o 500 da 2.33. Com o
  // primary no 50, 200/300 e a UNICA hierarquia de tres niveis que passa nas tres
  // superficies. O muted estava em 500 — o mesmo degrau do claro, o unico token de texto
  // que nao invertia —, e por ser igual ao claro o diff do generateTheme o omitia do bloco
  // escuro, o que fazia o defeito parecer uma linha esquecida no CSS. Ver rojao-ds#91 e #92.
  o["--text-secondary"] = step(Td, 200);
  o["--text-muted"] = step(Td, 300);
  o["--text-disabled"] = step(Td, 600);
  o["--text-inverse"] = step(ink, 900);
  o["--text-placeholder"] = step(Td, 300); // mesmo motivo do claro: 600 dava 1.53 sobre raised
  o["--icon-default"] = step(Td, 400);

  const db = def.dark?.brand;
  if (isNeutralBrand(def) && !db) {
    o["--brand-primary"] = "var(--color-white)";
    o["--brand-hover"] = step(Td, 100);
    o["--brand-on-primary"] = step(Td, 900);
    o["--brand-secondary"] = step(Td, 900);
    o["--brand-on-secondary"] = "var(--color-white)";
    o["--border-focus"] = step(Td, 400);
    o["--brand-text"] = step(Td, 50); // marca neutra no dark = texto claro legível
    Object.assign(o, secondaryTexture(`${Td}-900`)); // Td-900 é neutro → 'none' (sem grão)
  } else if (db) {
    if (db.primary) {
      // A marca é honrada LITERAL no dark também (intenção do lojista, não reancorar pra
      // contrastar com o fundo escuro): #000 fica #000, mesmo que se funda na página. O
      // contraste é garantido no par on-primary (texto do botão, derivado por WCAG a partir
      // da cor literal) e em --brand-text (marca-como-texto). Antes o guarda DS-1 (#26)
      // empurrava a cor pra um cinza — mas isso sequestrava a escolha do lojista; a política
      // agora é: o motor decide o contraste do TEXTO, nunca a cor da marca.
      const dpHex = isHex(db.primary);
      const dp = ref(db.primary, lit);
      o["--brand-primary"] = dp;
      if (dpHex) {
        const t = brandTones(db.primary);
        if (!db.hover) o["--brand-hover"] = t.hover;
        if (!db.onPrimary) o["--brand-on-primary"] = t.on;
      }
    }
    if (db.hover) o["--brand-hover"] = ref(db.hover, lit);
    if (db.onPrimary) o["--brand-on-primary"] = ref(db.onPrimary, lit);
    o["--brand-secondary"] = db.secondary
      ? ref(db.secondary, lit)
      : `color-mix(in srgb, ${ref(db.primary ?? def.brand.primary, lit)} 15%, transparent)`;
    if (db.onSecondary) o["--brand-on-secondary"] = ref(db.onSecondary, lit);
    // Mede a secondary dark explícita; sem ela (tint de 15% do primary) não texturiza — 'none'.
    // NÃO passar null pra secondaryTexture: null cai no fallback "cromático" (isChromaticSurface(null)
    // → true, reservado a ref custom irresolúvel) e pintaria grão sobre uma banda translúcida.
    Object.assign(o, db.secondary
      ? secondaryTexture(db.secondary)
      : { "--brand-secondary-texture": "none", "--brand-secondary-texture-size": SECONDARY_TEXTURE_SIZE });
    if (db.accent) {
      o["--brand-accent"] = ref(db.accent, lit);
      // accentLight ausente → derivado (color-mix 15%), conforme schema
      o["--brand-accent-light"] = db.accentLight
        ? ref(db.accentLight, lit)
        : `color-mix(in srgb, ${ref(db.accent, lit)} 15%, transparent)`;
    }
    if (db.onAccent) o["--brand-on-accent"] = ref(db.onAccent, lit);
    o["--border-focus"] = ref(db.borderFocus ?? db.primary ?? def.brand.primary, lit);
    // Affordance do fill no dark: hairline quando a marca encosta na página escura.
    const pbd = primaryFillBorder(db.primary ?? def.brand.primary, `${Sd}-900`);
    if (pbd) o["--brand-primary-border"] = pbd;
  } else if (isHex(def.brand.primary)) {
    // chromatic custom sem dark.brand: emite o tom próprio do ESCURO (a cor crua
    // se ela já contrasta no fundo escuro — ex. amber vibrante; ou clareada se for
    // escura demais — ex. verde-escuro). Incondicional pra NÃO herdar o tom
    // escurecido do light. Recalcula hover/on; border-focus segue o mesmo tom.
    const dp = surfaceSafeHex(def.brand.primary, "dark");
    const t = brandTones(dp);
    o["--brand-primary"] = dp;
    o["--brand-hover"] = t.hover;
    o["--brand-on-primary"] = t.on;
    o["--border-focus"] = dp;
  }
  // Cor de marca legível como TEXTO sobre a surface escura (min 3 = piso; cru quando passa).
  if (!("--brand-text" in o)) {
    o["--brand-text"] = isHex(def.brand.primary)
      ? surfaceSafeHex(def.dark?.brand?.primary && isHex(def.dark.brand.primary) ? def.dark.brand.primary : def.brand.primary, "dark")
      : def.dark?.brand?.primary ? ref(def.dark.brand.primary, lit) : step(Td, 50);
  }
  const hasSecondary = !!db || isNeutralBrand(def) || !!def.brand.secondary;
  if (hasSecondary) {
    // dark.brand presente SEM secondary → --brand-secondary é o tint translúcido de 15% do primary,
    // não uma cor opaca: não é superfície de identidade. Trata como neutro (colapsa em surface-page),
    // senão o sunken vira uma banda semitransparente e o on-color é medido na secondary CLARA (errada).
    const translucentSecondary = !!db && !db.secondary;
    const darkSecRef = db?.secondary ?? (isNeutralBrand(def) && !db ? `${Td}-900` : def.brand.secondary ?? null);
    const chromatic = !translucentSecondary && isChromaticSurface(darkSecRef);
    // Superfície da BANDA de identidade (topo das faces). Cromática → a cor da marca (banda
    // verde/vermelha, intencional). Neutra (quase-preto, ex. academia dark) → puxa da FAMÍLIA
    // neutra (surface-page) pra não ser o único cinza fora da rampa (com undertone quente). Só no
    // dark: no light a banda-marca escura já é um header coerente sobre a página clara.
    o["--brand-secondary-surface"] = chromatic ? "var(--brand-secondary)" : "var(--surface-page)";
    // Banda decorativa da Bio: cromática → cor da marca (faixa colorida). Neutra (quase-preto) →
    // 'transparent': a faixa não pinta nada e deixa a PRÓPRIA página (bolinhas + spotlight) passar,
    // dando o brilho seguindo o mouse ACIMA do nome sem furar a superfície sólida do nome (sunken).
    o["--brand-secondary-band"] = chromatic ? "var(--brand-secondary)" : "transparent";
  }
  return o;
}

/**
 * mix — monocromático via color-mix sobre duas âncoras (studio). Dark-only:
 * a página JÁ é o escuro (A = surface-900), as superfícies sobem com branco,
 * o texto desce do branco. Sem bloco dark separado.
 */
function mixTheme(def: BrandDef): TokenMap {
  const A = step(def.surface, 900);                 // âncora escura (cream-900)
  const W = "var(--color-white)";                   // âncora clara
  const onA = (p: number) => `color-mix(in srgb, ${W} ${p}%, ${A})`;
  const lift = (p: number) => `color-mix(in srgb, ${W} ${p}%, transparent)`;
  const o: TokenMap = { ...fonts(def), ...brandLight(def, !!def.allowLiteral) };

  o["--surface-page"] = A;
  o["--surface-default"] = onA(5);
  o["--surface-raised"] = onA(9);
  o["--surface-overlay"] = W;
  o["--surface-invert"] = W;

  o["--border-subtle"] = lift(8);
  o["--border-default"] = lift(14);
  o["--border-strong"] = lift(26);
  o["--border-control"] = lift(40);
  o["--border-focus"] = W;
  o["--border-on-invert"] = `color-mix(in srgb, ${A} 16%, transparent)`;

  o["--text-primary"] = W;
  o["--text-secondary"] = onA(68);
  o["--text-muted"] = onA(46);
  o["--text-disabled"] = onA(30);
  o["--text-inverse"] = A;
  o["--text-placeholder"] = onA(36);
  o["--icon-default"] = onA(68);
  o["--brand-text"] = W; // mono dark-only: marca legível como texto = branco
  return o;
}

/**
 * Resolve um valor de `extras`. Shorthand de ColorRef (paleta-step, keyword,
 * #hex, mix(...)) passa por ref(); qualquer outra coisa (rgba, var já pronto)
 * é emitida literal. Extras = a camada de DECISÃO explícita do tema.
 */
function resolveExtra(v: string): string {
  if (v === "transparent") return "transparent";
  if (/^#/.test(v) || /^mix\(/.test(v) || /^[a-zA-Z]+-\d+$/.test(v) || v === "white" || v === "black")
    return ref(v, true);
  return v;
}

function applyExtras(l: TokenMap, dark: TokenMap, def: BrandDef): void {
  if (!def.extras) return;
  for (const [tok, val] of Object.entries(def.extras)) {
    if (val.light !== undefined) l[tok] = resolveExtra(val.light);
    if (val.dark !== undefined) dark[tok] = resolveExtra(val.dark);
  }
}

// Ramp de tamanho primitivo (px). O text style só pode apontar pra um destes —
// mantém a escala consistente (nada de 23px fora do grid).
const FONT_SCALE: Record<string, string> = {
  xs: "12px", sm: "14px", base: "16px", lg: "18px",
  xl: "20px", "2xl": "24px", "3xl": "30px", "4xl": "36px",
};

// Paletas custom — deriva a escala 50–900 de cada hex (buildScale) e emite
// --color-<nome>-<step> (primitivo, igual nos 2 modos → vai no mapa light).
// Sem `palettes` → nada emitido. É a mecânica do guru (#28) por marca.
function applyPalettes(l: TokenMap, def: BrandDef): void {
  if (!def.palettes) return;
  for (const [name, val] of Object.entries(def.palettes)) {
    if (typeof val === "string") {
      if (!isHex(val)) continue;
      const scale = buildScale(val);
      for (const step of SCALE_STEPS) l[`--color-${name}-${step}`] = scale[step];
    } else {
      // escala completa (curada) — emite como-está, preservando a curva.
      for (const [step, hex] of Object.entries(val)) l[`--color-${name}-${step}`] = hex;
    }
  }
}

// Type scale — emite --font-size-<style> só para os styles que apontam pra um
// token. Não muda por modo (vai no mapa light). Sem `type` → nada emitido.
function applyType(l: TokenMap, def: BrandDef): void {
  if (!def.type) return;
  for (const [name, style] of Object.entries(def.type)) {
    const px = style?.token ? FONT_SCALE[style.token] : undefined;
    if (px) l[`--font-size-${name}`] = px;
  }
}

// Arredondamento do tema (#338/#341). Emite só o que difere do default "soft" da
// base (diff-clean). `radius` aceita um nível único (aplica a todos os papéis) OU
// por papel { control, card, avatar }. O badge segue pill (não emite).
const RADIUS_LEVEL: Record<RadiusScale, string> = {
  square: "0",
  sharp: "0.25rem", // 4px
  soft: "0.5rem",   // 8px (= base)
  round: "1rem",    // 16px
  pill: "9999px",
};
function applyRadius(l: TokenMap, def: BrandDef): void {
  const r = def.radius;
  if (!r) return;
  const roles = typeof r === "string" ? { control: r, card: r, avatar: r } : r;
  const set = (lvl: RadiusScale | undefined, token: string) => {
    if (lvl && lvl !== "soft") l[token] = RADIUS_LEVEL[lvl];
  };
  set(roles.control, "--radius-control");
  set(roles.card, "--radius-card");
  set(roles.avatar, "--radius-avatar");
  // tooltip/toast acompanham o controle; toast nunca vira pílula (é largo).
  if (roles.control && roles.control !== "soft") {
    l["--radius-tooltip"] = RADIUS_LEVEL[roles.control];
    l["--radius-toast"] = RADIUS_LEVEL[roles.control === "pill" ? "round" : roles.control];
  }
}

// Voz do display (nome/títulos) além da fonte: uppercase + tracking. #341.
function applyDisplay(l: TokenMap, def: BrandDef): void {
  const d = def.display;
  if (!d) return;
  if (d.transform) l["--display-transform"] = d.transform;
  if (d.tracking === "wide") l["--display-tracking"] = "0.08em";
}

// Aura radial da brand no topo do fundo (--surface-gradient). Opt-in via
// surfaceGradient (%); o consumidor aplica como background do wrapper. #341/#343.
function applyGradient(l: TokenMap, def: BrandDef): void {
  const g = def.surfaceGradient;
  if (!g) return;
  const pct = Math.min(g, 40);
  l["--surface-gradient"] = `radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--brand-primary) ${pct}%, transparent), transparent 68%)`;
}

// Textura do fundo da vitrine (Onda 4, #350). Opt-in via surfacePattern. Emite
// --surface-texture (background-image) + --surface-texture-size (background-size);
// o consumidor compõe junto do --surface-gradient. Tudo CSS puro/SVG inline — sem
// asset externo. 'none'/ausente → nada (diff-clean). Alpha baixo de propósito:
// textura é ambiente, não ruído que briga com o conteúdo.
const SURFACE_TEXTURE: Record<Exclude<SurfacePattern, "none">, { image: string; size: string }> = {
  dots: {
    image: "radial-gradient(color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1.5px)",
    size: "16px 16px",
  },
  grain: {
    image: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E\")",
    size: "120px 120px",
  },
  rays: {
    image: "repeating-conic-gradient(from 0deg at 50% 0%, color-mix(in srgb, var(--brand-primary) 6%, transparent) 0deg 4deg, transparent 4deg 12deg)",
    size: "auto",
  },
  "soft-blobs": {
    image: "radial-gradient(40% 40% at 15% 10%, color-mix(in srgb, var(--brand-primary) 7%, transparent), transparent 70%), radial-gradient(45% 45% at 90% 18%, color-mix(in srgb, var(--brand-accent, var(--brand-primary)) 6%, transparent), transparent 70%)",
    size: "auto",
  },
};
function applySurfacePattern(l: TokenMap, def: BrandDef): void {
  const p = def.surfacePattern;
  if (!p || p === "none") return;
  const t = SURFACE_TEXTURE[p];
  l["--surface-texture"] = t.image;
  l["--surface-texture-size"] = t.size;
}

// Estilo dos cards de produto/destaque (Onda 4, #350). Opt-in via `card`. Emite só
// os papéis declarados (diff-clean): sombra, proporção da imagem e flag de overlay
// (texto sobre a foto, consumido pelo CSS da vitrine). Sombra usa a tinta do texto
// pra acompanhar o modo (no dark vira fumaça preta natural).
const CARD_SHADOW: Record<NonNullable<NonNullable<BrandDef["card"]>["elevation"]>, string> = {
  flat: "none",
  sm: "0 1px 2px color-mix(in srgb, var(--text-primary) 8%, transparent)",
  md: "0 4px 14px color-mix(in srgb, var(--text-primary) 12%, transparent)",
};
const CARD_RATIO: Record<NonNullable<NonNullable<BrandDef["card"]>["imageRatio"]>, string> = {
  square: "1 / 1",
  portrait: "3 / 4",
  landscape: "4 / 3",
};
function applyCard(l: TokenMap, def: BrandDef): void {
  const c = def.card;
  if (!c) return;
  if (c.elevation) l["--card-shadow"] = CARD_SHADOW[c.elevation];
  if (c.imageRatio) l["--card-image-ratio"] = CARD_RATIO[c.imageRatio];
  if (c.overlay) l["--card-overlay"] = "1";
}

// Hero da vitrine (Onda 4, #350). Aqui só o VALOR do scrim (--hero-overlay): um
// gradiente preto subindo da base pra headline ficar legível sobre a foto. A
// ESTRUTURA do hero (treatment/logoFrame) e o template (layout) viajam no recipe
// como dado e são lidos pelo consumidor como data-* — não são tokens de cor.
function applyHero(l: TokenMap, def: BrandDef): void {
  const h = def.hero;
  if (!h || h.overlay === undefined) return;
  const pct = Math.min(Math.max(h.overlay, 0), 90);
  l["--hero-overlay"] = `linear-gradient(to top, color-mix(in srgb, #000 ${pct}%, transparent), transparent 62%)`;
}

// DS-4 (#29) — normaliza o recipe preenchendo secondary/accent HARMÔNICOS quando o lojista
// declarou só a primary (override de 1 cor). Feito ANTES de light()/darkFull() pra que TODA a
// máquina (sunken, texture, on-colors, tratamento dark) trate os derivados como se fossem do
// recipe — sem duplicar a derivação nas duas funções densas. Só com primary HEX custom; refs de
// paleta (temas curados) trazem os 3 papéis à mão e passam intactos. Imutável (não muta o def).
function withDerivedHarmony(def: BrandDef): BrandDef {
  let next = def;
  // Marca do LIGHT: primary hex sem secondary/accent → deriva harmônicos da primary.
  const b = def.brand;
  if (isHex(b.primary) && (!b.secondary || !b.accent)) {
    const h = deriveHarmony(b.primary);
    next = { ...next, brand: { ...b, secondary: b.secondary ?? h.secondary, accent: b.accent ?? h.accent } };
  }
  // Marca do DARK (dark.brand): quando o recipe/consumidor traz uma primary hex própria pro escuro
  // (ex.: um espelho `dark.brand`, que força o motor a honrar a marca no dark em vez de
  // invertê-la), deriva secondary/accent harmônicos da primary DARK. Sem isto o darkFull emitia o
  // secondary como tint translúcido — o modo escuro perdia a harmonia que o light ganhou.
  const db = def.dark?.brand;
  const dp = db?.primary;
  if (db && dp && isHex(dp) && (!db.secondary || !db.accent)) {
    const h = deriveHarmony(dp);
    next = { ...next, dark: { ...next.dark, brand: { ...db, secondary: db.secondary ?? h.secondary, accent: db.accent ?? h.accent } } };
  }
  return next;
}

export function generateTheme(def: BrandDef): GenResult {
  def = withDerivedHarmony(def);
  if (def.scaleMode === "mix") {
    const l = mixTheme(def);
    const dark: TokenMap = {};
    applyPalettes(l, def);
    applyExtras(l, dark, def);
    applyType(l, def);
    applyRadius(l, def);
    applyDisplay(l, def);
    applyGradient(l, def);
    applySurfacePattern(l, def);
    applyCard(l, def);
    applyHero(l, def);
    return { supported: true, light: l, dark };
  }
  const l = light(def);
  const full = darkFull(def);
  const dark: TokenMap = {};
  for (const [k, v] of Object.entries(full)) if (l[k] !== v) dark[k] = v;
  applyPalettes(l, def);
  applyExtras(l, dark, def);
  applyType(l, def);
  applyRadius(l, def);
  applyDisplay(l, def);
  applyGradient(l, def);
  applySurfacePattern(l, def);
  applyCard(l, def);
  applyHero(l, def);
  return { supported: true, light: l, dark };
}

export interface ResolvedTheme {
  tokens: TokenMap;
  isDark: boolean;
}

// DS-3 (#28) — contrato único de derivação + modo. generateTheme devolve `light` + `dark`(diff);
// cada consumidor tinha que fundir na mão (uma cópia no DS, outra em cada app consumidor, +
// o inline do layout, + StoreClosed — 4 cópias que divergem). resolveTheme centraliza a fusão:
// recebe o `mode` JÁ DECIDIDO (a POLÍTICA — THEMES_ENABLED, premium, override de mode — é do
// consumidor e NÃO entra aqui) e devolve os tokens prontos pra injetar + o booleano isDark.
export function resolveTheme(def: BrandDef, opts?: { mode?: string | null }): ResolvedTheme {
  const { light, dark } = generateTheme(def);
  const isDark = opts?.mode === "dark";
  return { tokens: isDark ? { ...light, ...dark } : light, isDark };
}
