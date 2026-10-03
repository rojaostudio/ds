/**
 * Alvo React Native do DS. AUTO-GERADO por scripts/build-native.ts.
 *
 * @experimental Fora do semver na 2.0: o alvo nativo (`@rojaostudio/ds/native/*`) segue a API 1.x
 * (Button variant='primary', Modal, Menu…) e o tema do generateTheme 1.x. Será alinhado à 2.0 na 2.1;
 * até lá pode mudar em qualquer versão, inclusive minor e patch.
 *
 * @packageDocumentation
 *
 * - primitives: paletas cruas (hex). Fonte: tokens/index.ts.
 * - dsTheme: tema padrão do DS resolvido (light/dark). Marca própria entra por prop.
 *
 * NativeWind (app):
 *   presets: [require('nativewind/preset'), require('@rojaostudio/ds/native/preset')]
 *   @import '@rojaostudio/ds/native/theme.css';   // vars --ds-* (:root / .dark)
 */

export { primitives } from '@rojaostudio/ds-core/tokens';
export { dsTheme, type ThemeMap } from './theme';
export { fonts, type DsFonts } from './fonts';
