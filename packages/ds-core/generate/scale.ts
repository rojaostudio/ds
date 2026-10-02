/**
 * scale.ts — deriva uma escala 50–900 a partir de UMA cor custom (1 hex). #28.
 *
 * O motor (generateTheme) resolve cor por step(palette, n) → var(--color-<p>-<n>),
 * o que exige uma paleta com escala pronta. Pra cor de marca arbitrária — o
 * cor livre escolhida por quem usa — não há paleta curada: esta
 * função deriva a escala mantendo o matiz e cravando a cor ORIGINAL no step de
 * lightness mais próximo, pra o usuário sempre enxergar a SUA cor no resultado.
 *
 * Curva em OKLCH (espaço perceptual, como Tailwind v4/Radix): L por step + croma
 * modulado (menos nos claros pra não lavar, cheio nos médios-escuros pra tom vivo)
 * + redução de croma ao gamut sRGB. Tons escuros preservam croma (sem marrom-lama
 * do HSL antigo). Quentes (amarelo/âmbar) giram o matiz pro laranja ao escurecer —
 * como o Material — porque amarelo-escuro-vibrante não existe no sRGB.
 *
 * Semente: um buildPalette de 5 slots, expandido para 10 steps,
 * mais os helpers de contraste WCAG (on-color legível sobre cor saturada).
 */

import { primitives } from "../tokens";

export type ScaleStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type Scale = Record<ScaleStep, string>;

export const SCALE_STEPS: ScaleStep[] = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// Lightness-alvo por step (OKLCH L, 0–1). 50 quase-branco → 900 quase-preto.
// Cauda funda (900≈0.255) pra neutros profundos (coal/zinc) chegarem ao quase-preto;
// topo/meio (50–500) calibrados pra cromáticas. 900 não desce abaixo de ~0.25 ou as
// cromáticas-900 viram blocos pretos sem matiz. Passos perceptuais (ΔL crescente).
const L_T: Record<ScaleStep, number> = {
  50: 0.985, 100: 0.945, 200: 0.875, 300: 0.785, 400: 0.675,
  500: 0.565, 600: 0.455, 700: 0.355, 800: 0.255, 900: 0.16,
};

// Multiplicador de croma por step: menos nos claros (evita lavado/clip de gamut),
// cheio nos médios-escuros (tom vivo). O gamut depois corta o que não cabe.
const C_MUL: Record<ScaleStep, number> = {
  50: 0.42, 100: 0.58, 200: 0.78, 300: 0.90, 400: 0.97,
  500: 1.0, 600: 1.0, 700: 1.0, 800: 0.96, 900: 0.90,
};

// ── HSL ↔ HEX (matiz/saturação — usado por isNeutralBrand e round-trips) ───────

export function hexToHsl(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = ln - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── sRGB ↔ linear ↔ OKLCH (Björn Ottosson) ────────────────────────────────────

const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;
const toLin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const toGam = (c: number) => { const s = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(Math.max(0, Math.min(1, s)) * 255); };

/** hex → OKLCH [L (0–1), C (croma), h (radianos)]. */
function hexToOklch(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const r = toLin(parseInt(m.slice(0, 2), 16));
  const g = toLin(parseInt(m.slice(2, 4), 16));
  const b = toLin(parseInt(m.slice(4, 6), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * mm - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * mm + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * mm - 0.8086757660 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function oklchToLinRgb(L: number, C: number, h: number): [number, number, number] {
  const A = C * Math.cos(h), B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((c) => c >= -0.001 && c <= 1.001);

/** OKLCH → hex, reduzindo croma até caber no sRGB (preserva L e h — evita clip que torce o matiz). */
function oklchToHex(L: number, C: number, h: number): string {
  if (!inGamut(oklchToLinRgb(L, C, h))) {
    let lo = 0, hi = C;
    for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if (inGamut(oklchToLinRgb(L, mid, h))) lo = mid; else hi = mid; }
    C = lo;
  }
  const [r, g, b] = oklchToLinRgb(L, C, h);
  return `#${[toGam(r), toGam(g), toGam(b)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

// Quentes (amarelo/âmbar, 60–115° OKLCH) não têm versão escura vibrante no sRGB →
// gira o matiz pro laranja (~55°) ao escurecer, recuperando croma. Como o Material.
function warmShiftDeg(hDeg: number, L: number, Lanchor: number): number {
  if (hDeg < 60 || hDeg > 115 || L >= Lanchor) return hDeg;
  const t = Math.min(1, (Lanchor - L) / (Lanchor - 0.35));
  return hDeg - t * (hDeg - 55) * 0.9;
}

// Quentes (amarelo/âmbar) não têm versão ESCURA vibrante no sRGB — escurecer vira
// marrom-lama. Então comprime a faixa de L (piso mais alto) pra elas, como o Material:
// a rampa fica dourada/âmbar viva em vez de descer ao marrom. Vermelho (hue<45°, tem
// escuro vibrante) e cores frias mantêm o piso normal (0.255).
function warmFloor(hDeg: number): number {
  if (hDeg >= 95 && hDeg <= 115) return 0.62; // amarelo
  if (hDeg >= 45 && hDeg < 95) return 0.255 + ((hDeg - 45) / 50) * (0.62 - 0.255); // laranja/âmbar
  return 0.255; // vermelho/frias
}

// ── Escala ───────────────────────────────────────────────────────────────────

// Step cujo lightness-alvo (OKLCH L) é o mais próximo do L de entrada — é onde a
// cor original é cravada (em vez de derivada), pra preservar a escolha do usuário.
export function nearestStep(lOklch: number): ScaleStep {
  let best: ScaleStep = SCALE_STEPS[0];
  let bestDiff = Infinity;
  for (const step of SCALE_STEPS) {
    const diff = Math.abs(L_T[step] - lOklch);
    if (diff < bestDiff) { bestDiff = diff; best = step; }
  }
  return best;
}

/**
 * Gera a escala 50–900 de uma cor (OKLCH). O step mais próximo do L de entrada
 * recebe a cor EXATA; os demais fixam o matiz, atingem o L-alvo do step e modulam
 * croma (com redução ao gamut). Quentes giram pro laranja no escuro (warmShift).
 */
export function buildScale(inputHex: string): Scale {
  const [Li, Ci, hRad] = hexToOklch(inputHex);
  const hDeg = ((hRad * DEG) % 360 + 360) % 360;
  // Piso do 900 por tipo: neutro/quase-neutro (cinza, coal, zinc) desce ao quase-preto
  // (0.16); cromático frio fica profundo (0.255); quente sobe (warmFloor). Guarda por Ci
  // porque cinza puro tem matiz-ruído que cairia no warmFloor por acidente.
  const floor = Ci < 0.08 ? 0.16 : warmFloor(hDeg);
  const lAt = (s: ScaleStep) => floor + ((L_T[s] - 0.16) / 0.825) * (0.985 - floor);
  // âncora medida na curva real (comprimida): crava a cor exata no step de L mais próximo.
  let anchor: ScaleStep = SCALE_STEPS[0], bd = Infinity;
  for (const s of SCALE_STEPS) { const d = Math.abs(lAt(s) - Li); if (d < bd) { bd = d; anchor = s; } }
  const isNeutral = Ci < 0.02; // neutro (coal/zinc): zera o tinte residual nos claros
  const out = {} as Scale;
  for (const step of SCALE_STEPS) {
    if (step === anchor) { out[step] = inputHex.toLowerCase(); continue; }
    const L = lAt(step);
    const h = warmShiftDeg(hDeg, L, Li) * RAD;
    const cMul = isNeutral && step <= 200 ? 0 : C_MUL[step];
    out[step] = oklchToHex(L, Ci * cMul, h);
  }
  return out;
}

// ── Contraste WCAG 2.x ────────────────────────────────────────────────────────

export function relativeLuminance(hex: string): number {
  const m = hex.replace("#", "");
  const channel = (v: number) => {
    const sr = v / 255;
    return sr <= 0.03928 ? sr / 12.92 : Math.pow((sr + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(m.slice(0, 2), 16));
  const g = channel(parseInt(m.slice(2, 4), 16));
  const b = channel(parseInt(m.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Melhor cor de texto ("on-<color>") sobre um fundo: testa branco, preto e os
 * extremos da própria escala (quando dada) e devolve o de MAIOR contraste —
 * garante legibilidade do texto sobre a cor de marca, inclusive tons médios
 * saturados onde quase-branco ficaria frágil (~3:1).
 */
export function onColor(bgHex: string, scale?: Scale): string {
  const candidates = ["#ffffff", "#000000", scale?.[50], scale?.[900]].filter(
    (c): c is string => !!c,
  );
  let best = candidates[0];
  let bestRatio = 0;
  for (const c of candidates) {
    const ratio = contrastRatio(bgHex, c);
    if (ratio > bestRatio) { bestRatio = ratio; best = c; }
  }
  return best;
}

// ── Derivação de marca a partir de 1 hex ──────────────────────────────────────

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** A ColorRef é um hex literal de 6 dígitos (cor de marca custom)? */
export const isHex = (c: string): boolean => HEX_RE.test(c);

// ── Resolução de ColorRef de paleta → hex (pra derivar contraste/hover) ────────
// Mesma fonte de verdade do motor: as paletas curadas de tokens/index.ts. Permite
// derivar on-color e hover de "coal-900" / "teal-500" igual ao caminho hex (#28→#13).

const PALETTE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
type PaletteMap = Record<string, Record<number, string>>;

function parseRef(c: string): { palette: string; step: number } | null {
  const m = c.match(/^([a-zA-Z][a-zA-Z-]*?)-(\d{2,3})$/);
  if (!m) return null;
  return { palette: m[1], step: Number(m[2]) };
}

/** ColorRef (paleta-step, white/black, #hex) → hex de 6 dígitos, ou null. */
export function refToHex(c: string): string | null {
  if (isHex(c)) return c;
  if (c === "white") return "#ffffff";
  if (c === "black") return "#000000";
  const p = parseRef(c);
  if (!p) return null;
  const hex = (primitives.color as PaletteMap)[p.palette]?.[p.step];
  return typeof hex === "string" && HEX_RE.test(hex) ? hex : null;
}

/** Keyword on-color (white|black) de maior contraste sobre uma ColorRef. null se irresolúvel. */
export function onColorRef(c: string): "white" | "black" | null {
  const hex = refToHex(c);
  if (!hex) return null;
  return onColor(hex) === "#000000" ? "black" : "white";
}

/** hover de uma ColorRef de paleta: 1 step mais escuro (ou mais claro no fundo da escala). */
export function hoverRef(c: string): string | null {
  const p = parseRef(c);
  if (!p) return null;
  const i = (PALETTE_STEPS as readonly number[]).indexOf(p.step);
  if (i < 0) return null;
  const j = i < PALETTE_STEPS.length - 1 ? i + 1 : i - 1;
  return `${p.palette}-${PALETTE_STEPS[j]}`;
}

/**
 * Tons de marca derivados de 1 hex, pro motor preencher o que o recipe não
 * trouxe: `hover` (um step mais escuro na escala; se a cor já está no fundo,
 * um mais claro) e `on` (texto de maior contraste sobre a cor).
 */
export function brandTones(hex: string): { hover: string; on: string } {
  const scale = buildScale(hex);
  // O passo vem de ONDE A COR FOI CRAVADA na escala, não de recalcular a luminância. O
  // buildScale aplica piso adaptativo e âncora de croma, então ele pode cravar a cor num step
  // vizinho ao que `nearestStep(L)` devolveria — e aí o "próximo step" caía exatamente sobre a
  // própria cor: hover === primary, botão sem feedback nenhum. Acontecia em ~metade dos hex
  // testados (#7C3AED e #2E7D32 cravam em 600 com nearestStep em 500; #FFEB3B crava em 200).
  // Invisível nos temas curados, que usam ColorRef e nem passam por aqui — só marca custom.
  const pinned = SCALE_STEPS.findIndex((s) => scale[s].toLowerCase() === hex.toLowerCase());
  const i = pinned >= 0 ? pinned : SCALE_STEPS.indexOf(nearestStep(hexToOklch(hex)[0]));
  const hoverStep = i < SCALE_STEPS.length - 1 ? SCALE_STEPS[i + 1] : SCALE_STEPS[i - 1];
  return { hover: scale[hoverStep], on: onColor(hex, scale) };
}

// ── Natureza da marca: neutral vs chromatic, DERIVADA (não declarada) ──────────

/** Saturação HSL (0–100) abaixo da qual a primary lê como P&B (neutral).
 *  20 dá margem: um slate-700 (s≈25, azulado) não cai por acaso no lado neutral.
 *  Casos de borda (pastel dessaturado-mas-colorido) usam o override archetype?. */
const NEUTRAL_SAT_MAX = 20;

type PaletteDefs = Record<string, string | Record<string, string>>;

/** ColorRef → hex, consultando as paletas custom do tema antes do core. */
function brandHex(c: string, palettes?: PaletteDefs): string | null {
  if (isHex(c)) return c;
  if (c === "white") return "#ffffff";
  if (c === "black") return "#000000";
  const p = parseRef(c);
  if (p && palettes) {
    const raw = palettes[p.palette];
    if (typeof raw === "string") return buildScale(raw)[p.step as ScaleStep] ?? null;
    if (raw && typeof raw === "object") return raw[String(p.step)] ?? null;
  }
  return refToHex(c);
}

/**
 * A marca é "neutral" (P&B) quando a primary é (quase) dessaturada — MEDIDO, não
 * declarado. Primary carvão/preta lê neutral; saturada lê chromatic. Substitui a
 * decisão explícita `archetype: 'neutral'|'chromatic'`. Um `archetype` explícito
 * no recipe ainda vence, como override de borda.
 */
export function isNeutralBrand(def: {
  brand: { primary: string };
  archetype?: string;
  palettes?: PaletteDefs;
}): boolean {
  if (def.archetype === "neutral") return true;
  if (def.archetype === "chromatic") return false;
  const hex = brandHex(def.brand.primary, def.palettes);
  if (!hex) return false; // irresolúvel → chromatic (seguro: focus ring = primary)
  const [, s] = hexToHsl(hex);
  return s <= NEUTRAL_SAT_MAX;
}

/**
 * Escurece um hex (preservando o matiz) até o ponto onde texto BRANCO atinge
 * WCAG AA (4.5:1) — usado como fill quando a marca escolheu uma cor clara demais
 * (sky, amber). Em vez de texto preto (legível mas sem "cara de marca"), o fill
 * vira um tom mais profundo da MESMA cor + branco por cima. Já legível → no-op.
 */
export function darkenForWhite(hex: string): string {
  if (!isHex(hex) || contrastRatio(hex, "#ffffff") >= 4.5) return hex;
  const scale = buildScale(hex);
  const [L] = hexToOklch(hex);
  const start = SCALE_STEPS.indexOf(nearestStep(L));
  for (let i = Math.max(start, 0); i < SCALE_STEPS.length; i++) {
    const c = scale[SCALE_STEPS[i]];
    if (contrastRatio(c, "#ffffff") >= 4.5) return c;
  }
  return scale[900];
}
