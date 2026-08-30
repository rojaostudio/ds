/**
 * DEPRECIADO — `@rojaostudio/ds/recipes` agora vive em `@rojaostudio/ds-core/recipes`.
 *
 * Este reexport existe para que a separação da #99 não quebre nenhum consumidor de uma
 * vez: quem já importava daqui continua funcionando. Sai na próxima major.
 *
 *   - import { … } from '@rojaostudio/ds/recipes'        ← ainda funciona, depreciado
 *   + import { … } from '@rojaostudio/ds-core/recipes'   ← o caminho novo
 */
export * from "@rojaostudio/ds-core/recipes";
