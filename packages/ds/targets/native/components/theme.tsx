import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dsTheme } from '../theme';

// Tema do DS no RN: provê o mapa de tokens resolvidos (light/dark) via contexto.
// Componentes leem cor/token daqui — sem CSS var, sem NativeWind (auto-contido).
export type ThemeTokens = Record<string, string>;

const ThemeContext = createContext<ThemeTokens>(dsTheme.light as ThemeTokens);

/** Mapa de marca: o mesmo formato que `dsTheme`. Gere o seu com `pnpm build:brands`. */
export type ThemeMaps = { light: Record<string, string>; dark: Record<string, string> };

// `theme` existe porque o provider era cravado numa marca só: qualquer app que instalasse
// o DS recebia as cores dela e não tinha como trocar — o lado web é temável por classe e o
// nativo não era temável de jeito nenhum. Sem a prop, a #101 não fecha. Ver #101.
type Props = { children: ReactNode; scheme?: 'light' | 'dark'; theme?: ThemeMaps };

export function DSThemeProvider({ children, scheme, theme }: Props) {
  const system = useColorScheme();
  const isDark = (scheme ?? system ?? 'light') === 'dark';
  const mapa = theme ?? (dsTheme as unknown as ThemeMaps);
  const resolved = (isDark ? mapa.dark : mapa.light) as ThemeTokens;
  return <ThemeContext.Provider value={resolved}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext);
}
