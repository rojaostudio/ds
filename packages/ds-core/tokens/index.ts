// Primitive values — source of truth for all projects
// Core palettes (neutral…indigo) são geradas pela mecânica Rojão (buildScale), não Material.
// Mirrors the Figma "[DS] Primitive tokens" library (Primitives collection)
// Each color palette has 10 steps: 50–900.

export const primitives = {
  color: {
    white: '#ffffff',
    black: '#000000',

    // Black/White com alpha — escala mesma das paletas (50-900 = % opacity).
    // Uso: estados disabled, overlays, scrim, hover sutil sobre qualquer fundo.
    // Hex 8 chars (#RRGGBBAA): 50=5% (0D) → 900=90% (E6).
    blackAlpha: {
      50: '#0000000D', 100: '#0000001A', 200: '#00000033', 300: '#0000004D',
      400: '#00000066', 500: '#00000080', 600: '#00000099', 700: '#000000B3',
      800: '#000000CC', 900: '#000000E6',
    },
    whiteAlpha: {
      50: '#FFFFFF0D', 100: '#FFFFFF1A', 200: '#FFFFFF33', 300: '#FFFFFF4D',
      400: '#FFFFFF66', 500: '#FFFFFF80', 600: '#FFFFFF99', 700: '#FFFFFFB3',
      800: '#FFFFFFCC', 900: '#FFFFFFE6',
    },

    neutral: {
      50: '#fafafa', 100: '#ededed', 200: '#d6d6d6', 300: '#b9b9b9',
      400: '#979797', 500: '#737373', 600: '#575757', 700: '#3c3c3c',
      800: '#232323', 900: '#0d0d0d',
    },
    red: {
      50: '#fff8f7', 100: '#ffe8e5', 200: '#ffccc4', 300: '#ffa598',
      400: '#ff6c5c', 500: '#f44336', 600: '#c50003', 700: '#990001',
      800: '#6f0000', 900: '#4b0000',
    },
    green: {
      50: '#f0ffef', 100: '#caffc8', 200: '#a5f0a4', 300: '#82d982',
      400: '#4caf50', 500: '#379c3d', 600: '#0a7e1c', 700: '#00610f',
      800: '#004507', 900: '#002d01',
    },
    amber: {
      50: '#fffaee', 100: '#fff2d6', 200: '#ffe3ab', 300: '#ffd068',
      400: '#ffc107', 500: '#e5a500', 600: '#d29100', 700: '#c08000',
      800: '#ae7000', 900: '#9d6100',
    },
    yellow: {
      50: '#fffcdc', 100: '#fff7b2', 200: '#ffeb3b', 300: '#f6df4b',
      400: '#eecb00', 500: '#e2b900', 600: '#d5a800', 700: '#c89800',
      800: '#bb8900', 900: '#af7b00',
    },
    blue: {
      50: '#f6fbff', 100: '#e2f0ff', 200: '#bddeff', 300: '#8cc6ff',
      400: '#44a7ff', 500: '#2196f3', 600: '#006bb5', 700: '#00518d',
      800: '#003966', 900: '#002445',
    },
    purple: {
      50: '#fef8ff', 100: '#fbe6ff', 200: '#f7c6ff', 300: '#f09bff',
      400: '#db6def', 500: '#bc4ad0', 600: '#9c27b0', 700: '#7e0090',
      800: '#5b0069', 900: '#3c0046',
    },
    teal: {
      50: '#ecfffb', 100: '#c0fdf2', 200: '#99eddf', 300: '#71d5c6',
      400: '#45b7a8', 500: '#009688', 600: '#00796d', 700: '#005d53',
      800: '#00423b', 900: '#002a25',
    },
    cyan: {
      50: '#f1fdff', 100: '#cef7ff', 200: '#86ecff', 300: '#56d4ea',
      400: '#00bcd4', 500: '#0095a8', 600: '#007585', 700: '#005a66',
      800: '#004049', 900: '#002930',
    },
    orange: {
      50: '#fff9f3', 100: '#ffeddd', 200: '#ffd8b4', 300: '#ffbb7a',
      400: '#ff9800', 500: '#dc7f00', 600: '#bd6a00', 700: '#a15700',
      800: '#854500', 900: '#6c3500',
    },
    pink: {
      50: '#fff8f9', 100: '#ffe8ea', 200: '#ffcad1', 300: '#ffa1b0',
      400: '#ff6587', 500: '#e91e63', 600: '#c0004d', 700: '#95003a',
      800: '#6d0027', 900: '#490017',
    },
    indigo: {
      50: '#f8faff', 100: '#e8eeff', 200: '#cdd9ff', 300: '#aabdff',
      400: '#809aff', 500: '#637ae3', 600: '#3f51b5', 700: '#3342a4',
      800: '#202885', 900: '#110e66',
    },

    // ── DS Custom palettes — universais. Primitivos disponíveis para qualquer projeto ──

    // Cobalt — azul profundo de marca (700 = canônico). Mais saturado/escuro
    // que blue. Uso típico: accent, link, focus, badge selecionado.
    cobalt: {
      50: '#f8faff', 100: '#e7eeff', 200: '#c9daff', 300: '#a3bfff',
      400: '#769dff', 500: '#4b79fa', 600: '#3259d8', 700: '#1e3fbc',
      800: '#0c1f98', 900: '#060076',
    },

    // Brick — laranja-tijolo, alerta de marca. Uso < 5% (badges críticos,
    // pre-order, destaque de alta tensão).
    brick: {
      50: '#fff8f7', 100: '#ffe9e4', 200: '#ffccc2', 300: '#ffa594',
      400: '#ff6d55', 500: '#e5462e', 600: '#c01b00', 700: '#950f00',
      800: '#6d0500', 900: '#4a0000',
    },

    // Cream — off-white amadeirado. Superfícies quentes e near-white sobre dark.
    // 50 = surface-page light; 100 = surface-raised light + text/borders sobre dark.
    cream: {
      50: '#fdfaf3', 100: '#f1ece3', 200: '#dcd5c8', 300: '#b8b0a0',
      400: '#9f9587', 500: '#7f7467', 600: '#605449', 700: '#46392f',
      800: '#2b2018', 900: '#140b05',
    },

    // Moss — verde-musgo dessaturado, de galeria/ateliê. Recua (frio, sóbrio),
    // o oposto do laranja que avança. Uso: accent autoral, links, detalhes. 500 = canônico.
    moss: {
      50: '#f3fdf6', 100: '#e3f1e7', 200: '#c9dbce', 300: '#aabfb0',
      400: '#889d8d', 500: '#677c6d', 600: '#566b5c', 700: '#2e4134',
      800: '#16281b', 900: '#031107',
    },

    // Clay — terracota queimada, tátil. Calor de tinta a óleo. Uso pontual (< 10%):
    // o gesto quente único (carimbo, sublinhado à mão, warm accent). 500 = canônico.
    clay: {
      50: '#fff8f6', 100: '#ffe9e2', 200: '#ffcdbc', 300: '#ffa789',
      400: '#e8825f', 500: '#c86240', 600: '#b5512e', 700: '#8a2900',
      800: '#651a00', 900: '#440c00',
    },

    // Paletas Project (coal/flare/zinc/ash/ember) saíram do core → viraram
    // custom por marca em recipes/index.ts (palettes), geradas no theme.css.
  },

  space: {
    0: 0, 1: 1, 2: 2, 4: 4, 8: 8, 12: 12, 16: 16, 20: 20,
    24: 24, 28: 28, 32: 32, 40: 40, 48: 48, 56: 56, 64: 64, 80: 80, 96: 96,
  },

  radius: { square: 0, sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  motion: { fast: 100, base: 150, slow: 300 },

  fontSize: {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20,
    '2xl': 24, '3xl': 30, '4xl': 36,
    '5xl': 48, '6xl': 56, '7xl': 64, '8xl': 72, '9xl': 88,  // display (landing/hero)
  },
  fontWeight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  // Unitless para escalar corretamente com o font-size do elemento.
  // Valores derivados das proporções originais (ex: 20/14 ≈ 1.43).
  lineHeight: { xs: 1.33, sm: 1.43, base: 1.5, lg: 1.56, xl: 1.6, '2xl': 1.67 },
  letterSpacing: { tight: -0.5, normal: 0, wide: 0.5 },

  // Control-specific semantic scale (System tokens)
  controlHeight:   { sm: 32, md: 40, lg: 48 },
  controlPaddingX: { sm: 12, md: 16, lg: 20 },
  controlPaddingY: { sm: 4,  md: 8,  lg: 12 },
  controlGap:      { sm: 4,  md: 8,  lg: 8  },
  icon: { size: 24 },
  borderWidth: { default: 1 },
} as const;

// Semantic tokens — light mode values (dark via CSS vars in base.css)
// Generated targets (native, figma, etc.) consume these directly.
// Dark mode: see darkTokens below — base.css .dark block must stay in sync.
export const tokens = {
  color: {
    surface: {
      page:    primitives.color.neutral[50],
      default: primitives.color.white,
      raised:  primitives.color.neutral[100],
      overlay: primitives.color.neutral[900],
    },
    border: {
      subtle:  primitives.color.neutral[100],
      default: primitives.color.neutral[200],
      strong:  primitives.color.neutral[300],
      focus:   primitives.color.black,
    },
    text: {
      primary:     primitives.color.neutral[900],
      secondary:   primitives.color.neutral[700],
      muted:       primitives.color.neutral[500],
      disabled:    primitives.color.neutral[400],
      inverse:     primitives.color.white,
      placeholder: primitives.color.neutral[400],
    },
    icon: { default: primitives.color.neutral[800] },
    action: {
      primary:     { default: primitives.color.neutral[900], hover: primitives.color.neutral[700], text: primitives.color.white },
      secondary:   { default: primitives.color.neutral[100], hover: primitives.color.neutral[200], text: primitives.color.neutral[700] },
      ghost:       { hover: primitives.color.neutral[100], text: primitives.color.neutral[700] },
      destructive: { default: primitives.color.red[600],   hover: primitives.color.red[700],   text: primitives.color.white },
    },
    feedback: {
      danger:  { base: primitives.color.red[500],    badge: primitives.color.red[100],    border: primitives.color.red[200],    text: primitives.color.red[700]    },
      success: { base: primitives.color.green[500],  badge: primitives.color.green[100],  border: primitives.color.green[500],  text: primitives.color.green[700]  },
      warning: { base: primitives.color.amber[500],  badge: primitives.color.amber[100],  border: primitives.color.amber[200],  text: primitives.color.amber[700]  },
      info:    { base: primitives.color.blue[500],   badge: primitives.color.blue[100],   border: primitives.color.blue[200],   text: primitives.color.blue[700]   },
    },
    // Attention — escala de urgência temporal (countdown/trial), 3 degraus crescentes
    // de saturação do amarelo Rojão (yellow-50 → 100 → 200) + texto quase-preto fixo
    // (amarelo+preto = máxima legibilidade). NÃO flipa no dark. Ver base.css p/ contraste.
    attention: {
      low:    { soft: primitives.color.yellow[50],  border: primitives.color.yellow[100], text: primitives.color.neutral[900] },
      medium: { soft: primitives.color.yellow[100], border: primitives.color.yellow[200], text: primitives.color.neutral[900] },
      high:   { soft: primitives.color.yellow[200], border: primitives.color.yellow[300], text: primitives.color.neutral[900] },
      // CTA fixo (não flipa no dark, pois o fundo amarelo é fixo).
      action: primitives.color.neutral[900],
      onAction: primitives.color.white,
    },
    // Avatar/monograma — paleta categórica decorativa para placeholder sem foto.
    // Indexado por hash do nome (1-6) → cor estável por produto/cliente.
    avatar: {
      1: { bg: primitives.color.blue[100],   fg: primitives.color.blue[800]   },
      2: { bg: primitives.color.purple[100], fg: primitives.color.purple[800] },
      3: { bg: primitives.color.teal[100],   fg: primitives.color.teal[800]   },
      4: { bg: primitives.color.orange[100], fg: primitives.color.orange[800] },
      5: { bg: primitives.color.pink[100],   fg: primitives.color.pink[800]   },
      6: { bg: primitives.color.indigo[100], fg: primitives.color.indigo[800] },
    },
    status: {
      active:   { base: primitives.color.green[500],   text: primitives.color.green[700]   },
      pending:  { base: primitives.color.amber[400],   text: primitives.color.amber[700]   },
      error:    { base: primitives.color.red[500],     text: primitives.color.red[700]     },
      inactive: { base: primitives.color.neutral[400], text: primitives.color.neutral[500] },
    },
  },
} as const;

// Semantic tokens — dark mode overrides
// These are the intended values. base.css .dark block must reflect them.
// Note: surface.page and surface.default sit between neutral steps — no exact primitive match.
//       Theme overrides may use the coal palette for tighter dark steps.
// Note: border uses alpha-based values (color-mix in base.css) — whiteAlpha steps are approximations.
export const darkTokens = {
  color: {
    surface: {
      page:    '#111111',                      // between neutral[900] and black
      default: '#1e1e1e',                      // between neutral[800] and neutral[900]
      raised:  primitives.color.neutral[800],  // #262626
      overlay: primitives.color.neutral[100],  // #f5f5f5
    },
    border: {
      subtle:  primitives.color.whiteAlpha[100],  // base.css: color-mix(white 8%, transparent)
      default: primitives.color.whiteAlpha[100],  // intentionally same as subtle
      strong:  primitives.color.whiteAlpha[200],  // base.css: color-mix(white 22%, transparent)
      focus:   primitives.color.white,
    },
    text: {
      primary:     primitives.color.neutral[50],   // #fafafa
      secondary:   primitives.color.neutral[400],  // #a3a3a3
      muted:       primitives.color.neutral[500],  // #737373
      disabled:    primitives.color.neutral[600],  // #525252
      inverse:     primitives.color.neutral[900],  // #171717
      placeholder: primitives.color.neutral[500],  // #737373
    },
    icon: { default: primitives.color.neutral[400] },  // #a3a3a3
  },
} as const;
