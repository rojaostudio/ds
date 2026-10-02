/**
 * @rojaostudio/ds-core — o motor do Rojão DS.
 *
 * Tokens, derivação de tema e emissores. Não importa React, não importa Tailwind e não
 * emite CSS acoplado a framework nenhum: `emitCss` devolve custom properties puras.
 *
 * Existe separado porque o pacote único obrigava quem queria só os tokens a declarar
 * React 19 e Tailwind 4 como peer dependencies — cliente dependendo do que não usa. A
 * fronteira já existia no código; passou a existir no empacotamento. Ver rojao-ds#99.
 */
export * from "./generate/index";
export { primitives, tokens } from "./tokens/index";
export { recipes, type RecipeName } from "./recipes/index";
