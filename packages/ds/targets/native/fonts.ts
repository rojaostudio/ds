// Famílias de fonte display do DS no target native (espelha --font-family-display
// do web, que usa Bricolage Grotesque). O RN não lê CSS nem fontes do sistema por
// peso arbitrário, então o DS PUBLICA os nomes de família esperados e o app os
// REGISTRA via expo-font (useFonts) com os arquivos da Bricolage Grotesque.
//
// Os nomes batem com os exports de `@expo-google-fonts/bricolage-grotesque`,
// o caminho recomendado de carregamento (ver docs/consuming-native-fonts.md).
//
// Corpo (body/label/caption) segue a fonte do sistema — só os títulos são display.
export const fonts = {
  display: {
    bold: 'BricolageGrotesque_700Bold',
    semibold: 'BricolageGrotesque_600SemiBold',
  },
} as const;

export type DsFonts = typeof fonts;
