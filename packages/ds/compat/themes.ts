/**
 * DEPRECIADO — `@rojaostudio/ds/themes` agora vive em `@rojaostudio/ds-core/themes`.
 *
 * Este reexport existe para que a separação da #99 não quebre nenhum consumidor de uma
 * vez: quem já importava daqui continua funcionando. Sai na próxima major.
 *
 *   - import { … } from '@rojaostudio/ds/themes'        ← ainda funciona, depreciado
 *   + import { … } from '@rojaostudio/ds-core/themes'   ← o caminho novo
 */
export * from "@rojaostudio/ds-core/themes";
