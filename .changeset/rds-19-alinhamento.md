---
"@rojaostudio/ds": minor
---

Alinhamento ao Figma [RDS] dos componentes que só existiam no código (o Figma é a verdade; o código segue um para um):

- **ToggleCard** ganha `layout="default" | "compact"`, como o componente do Figma (Forms/ToggleCard). O `compact` é a antiga linha do `ToggleCardCompact` (Item outline, resumo sob o rótulo, lápis que abre as opções) e traz as props `summary`, `icon`, `onEdit` e `editLabel`. `onCheckedChange` passa a ser opcional. O `ToggleCardCompact` continua exportado como wrapper deprecated de `<ToggleCard layout="compact">`; o codemod troca um pelo outro.
- **FloatingStepper**: a linha antes da ação agora é um `<Separator orientation="vertical">` de 24.
- **DataTableHeader**: a contagem de filtros vai no rótulo do botão, "Filtros · 3" (sem Badge), com o ícone antes do texto, como no Figma. Na largura de 796 a busca não espreme: o que não cabe ao lado dela desce para a linha de baixo.
- **ImageCropModal**: tokens novos na coleção Overlays, `image-crop-modal/shade` (surface/scrim), `/selection` e `/handle` (text/on/cover) e `/stage/background` (surface/muted). O palco ganha fundo e passa a ter 320 de altura (com teto de 60vh em tela baixa); a sombra fora do recorte, a linha do recorte (sólida, sem as formigas da biblioteca) e as alças leem esses tokens. As proporções usam os ícones do [RDS] (square, rectangle-vertical, rectangle-horizontal, square-dashed). No estado pronto aparece a dica "Arraste as alças para ajustar o recorte." (no Livre, a dica das proporções).
- **ChoiceCarousel**: a seta some de vez (não é renderizada) quando não há mais nada para aquele lado, em vez de ficar transparente.
- **PageSkeleton** e **CardsSkeleton**: os Cards voltam a ter a sombra `elevation/raised`, como no Figma.
- **SectionHeader**: `eyebrow` e `number` ficam deprecated (não existem no Figma). Ainda renderizam.

**Breaking** (2.0):

- **CurrencyInput**: sai a prop `size`, que já era ignorada.
- **SelectableCard**: saem `as`, `href`, `indicator` e `ribbon`, que já eram ignoradas.
- **ChoicePreviewCard**: saem `locked`, `badge` e `previewAspect`, que já eram ignoradas.
- **ImageUpload**: saem `aspect`, `variant`, `previewClassName` e `previewWrapperClassName`, que já eram ignoradas, e com elas os tipos `ImageUploadAspect` e `ImageUploadVariant`.

Codemod (`rojao-ds migrate`): `ToggleCardCompact` vira `<ToggleCard layout="compact">` (e `ToggleCardCompactProps` vira `ToggleCardProps`); remove `size` do CurrencyInput, `indicator` e `as="button"` do SelectableCard, `previewAspect` e `locked={false}` do ChoicePreviewCard, e `aspect`, `variant`, `previewClassName` e `previewWrapperClassName` do ImageUpload. Ficam para revisão manual, com a orientação no relatório, `as="a"`, `href` e `ribbon` do SelectableCard, `locked` e `badge` do ChoicePreviewCard e os tipos `ImageUploadAspect` e `ImageUploadVariant`.
