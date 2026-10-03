---
"@rojaostudio/ds": minor
---

Heading, como no Figma [RDS] Content/Heading: o título na dupla da marca.
- `level="band" | "heading" | "value"` (36/48, 24/30, 20/30, negrito), `tone="default" | "accent"` e `as="h1"`…`"h6"` (padrão `h2`; o tamanho não decide o nível do HTML).
- `<Heading.Mark>` (ou `HeadingMark`) pinta um trecho na outra cor da dupla: laranja num título `default`, a cor do título num `accent`.
- Tokens novos na coleção Content: `--heading-default` (→ `text/heading`) e `--heading-accent` (→ `colors/accent/default`).
- Laranja sobre branco não passa contraste nem em título grande (2,9:1 na Rojão): o `accent` e o destaque laranja são para fundo escuro ou a chapa da marca.

Muda aparência: na Rojão, `text/heading` no claro passa de laranja (#ff6a00) para azul (#1b2a4a), como no Figma. Mudam junto os componentes que usam o papel: títulos de Card, Dialog, AlertDialog, Accordion, Calendar e dos blocos, rótulos de campo, a etapa atual do Breadcrumb, o rótulo do Button neutral outline/ghost e outros. No escuro e na chapa nada muda.
