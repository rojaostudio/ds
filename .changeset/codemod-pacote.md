---
"@rojaostudio/ds-codemod": minor
"rojao-ds": minor
---

O codemod da migração 0.x/1.x → 2.0 sai de `packages/ds/scripts/migrate` e passa a viver em `packages/codemod`, um pacote interno do repositório (não é publicado no npm). Ele roda nos projetos do Rojão Studio, de dentro deste repositório:

```bash
pnpm migrate:consumer ../meu-app            # dry-run: plano e casos manuais com arquivo:linha
pnpm migrate:consumer ../meu-app --apply    # escreve, com um TODO(ds-2.0) acima de cada caso manual
```

A única dependência é o `ts-morph`, que não entra na CLI. O mapa ganha os renomes `FloatingStepper` → `Stepper` e `ImageCropModal` → `ImageCropDialog` (componentes, tipos e deep imports). Quem é de fora migra pelo guia [Migrar da 1.x](https://ds.rojao.ai/migrar).
