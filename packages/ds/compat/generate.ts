/**
 * DEPRECIADO — `@rojaostudio/ds/generate` agora vive em `@rojaostudio/ds-core/generate`.
 *
 * Este reexport existe para que a separação da #99 não quebre nenhum consumidor de uma
 * vez: quem já importava daqui continua funcionando. Sai na próxima major.
 *
 *   - import { … } from '@rojaostudio/ds/generate'        ← ainda funciona, depreciado
 *   + import { … } from '@rojaostudio/ds-core/generate'   ← o caminho novo
 */
export * from "@rojaostudio/ds-core/generate";
