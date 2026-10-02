/**
 * DEPRECIADO — `@rojaostudio/ds/tokens` agora vive em `@rojaostudio/ds-core/tokens`.
 *
 * Este reexport existe para que a separação da #99 não quebre nenhum consumidor de uma
 * vez: quem já importava daqui continua funcionando. Sai na próxima major.
 *
 *   - import { … } from '@rojaostudio/ds/tokens'        ← ainda funciona, depreciado
 *   + import { … } from '@rojaostudio/ds-core/tokens'   ← o caminho novo
 */
export * from "@rojaostudio/ds-core/tokens";
