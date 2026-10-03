# @rojaostudio/ds-codemod

## 0.1.0-next.1

### Minor Changes

- Sincronia com o Figma [RDS] de 03/10/2026: tokens extraídos de novo (agora por um script que está no repositório) e Card, Sidebar, DataTableHeader, SavingBar e ColorInput alinhados à spec atual.

  - **Extração reprodutível.** `packages/ds/scripts/figma/extract-tokens.figma.js` roda em leitura no Figma (Plugin API) e gera os `.txt` de tokens e o `theme.txt`/`foundation.txt` do ds-core no formato que o build lê. O CONTRIBUTING explica como rodar. O formato ganha uma coluna opcional `obsolete` para o token que o Figma marca como "Obsoleto": ele continua emitido no CSS, mas nenhuma folha de estilo precisa lê-lo.
  - **Tokens novos:** `--card-tint-title` (título do cartão tint, `text/on/tint`) e `--sidebar-item-indicator` (marcador do item ativo, `colors/primary/default`). **Alterado:** `--sidebar-item-label-active` passa de `colors/primary/default` para `text/on/tint`. **Obsoletos** (seguem existindo): `--card-footer-background` e `--card-tint-footer-background`.
  - **Card:** `surface` ganha `"outline"` (só a borda, sem fundo nem sombra, para cartões lado a lado numa grade ou dentro de painel). Muda aparência: respiro de 24 (16 no `sm`, antes 16/12); o tint perde a sombra e o título usa `--card-tint-title`; o rodapé não tem mais faixa nem linha de cima, as ações ficam lado a lado com 12 entre elas (a secundária em Button neutral ghost); `align="full"` deixou de empilhar e põe as duas ações lado a lado, metade cada. A ação do cabeçalho segue opcional.
  - **Sidebar:** muda aparência: o item ativo ganha o marcador de 3 × 20 à esquerda e o rótulo em semibold (600), na cor de `--sidebar-item-label-active`; a contagem do ativo usa `--sidebar-item-count`, como no Figma.
  - **DataTableHeader:** novo slot `view` (controle de visão, ex. Checkbox "Agrupar por produto"), depois dos filtros e antes das ações, visível também no estreito. A busca fica à esquerda com base e mínimo de 320 (nunca mais larga que a barra) e o resto é empurrado para a direita.
  - **SavingBar:** a barra vira um container de tamanho e escolhe o arranjo pela própria largura: abaixo de 1024, mensagem em cima (até 2 linhas com reticências) e Descartar e Salvar embaixo dividindo a largura; a partir de 1024, a mensagem cresce ao lado das ações com mínimo de 160.
  - **ColorInput:** a amostra escolhida, o foco na paleta e a amostra do campo usam o anel do Button e do Checkbox, com respiro (`outline-offset` igual à largura do anel).
  - **PageSkeleton:** a linha de cabeçalho da tabela usa `--table-header-background` no lugar do token obsoleto do rodapé do Card (mesma cor).

  **Breaking:**

  - `DataTableHeader`: `pillFilters` (array de `DataTablePillDef`) saiu; os filtros rápidos são o slot `quickFilters?: ReactNode` (até três, um `<FilterChipGroup>` com `<FilterChip>`; quatro ou mais, um Button com menu). O tipo `DataTablePillDef` saiu do barril. "Filtros · N" passa a contar só os filtros que o botão abre (os rápidos mostram o estado deles à vista), e `onClear` limpa esses filtros. O codemod troca `pillFilters={lista}` por `quickFilters={<FilterChipGroup aria-label="Filtros rápidos">{lista.map(…<FilterChip>…)}</FilterChipGroup>}` e importa os dois componentes; `DataTablePillDef` é reportado como manual.
  - `SavingBar`: a mensagem e as ações agora ficam dentro de `.rds-savingbar__row`, e o texto em `.rds-savingbar__text`; quem estiliza por classe precisa rever os seletores.
  - Card: o rodapé deixa de ler `--card-footer-background`/`--card-tint-footer-background` e a classe `rds-card__footer` perde fundo e borda.

  O codemod também passa a migrar `<Card variant="outlined">` para `surface="outline"` e a remover `variant="elevated"` (o padrão); `filled`, `flat` e `invert` continuam manuais.

## 0.1.0-next.0

### Minor Changes

- Novo pacote `@rojaostudio/ds-codemod` (bin `rojao-ds-codemod`): o codemod da migração 0.x/1.x → 2.0 ao alcance de quem consome, sem clonar este repositório.

  ```bash
  npx @rojaostudio/ds-codemod ./meu-app            # dry-run: plano e casos manuais com arquivo:linha
  npx @rojaostudio/ds-codemod ./meu-app --apply    # escreve, com um TODO(ds-2.0) acima de cada caso manual
  ```

  O motor e o mapa saíram de `packages/ds/scripts/migrate` e vivem só no pacote novo; a única dependência é o `ts-morph`. Dentro do repositório, `pnpm migrate:consumer <pasta>` continua funcionando e roda o mesmo código. O mapa ganha os renomes `FloatingStepper` → `Stepper` e `ImageCropModal` → `ImageCropDialog` (componentes, tipos e deep imports).

  A CLI ganha `npx rojao-ds migrate <pasta> [--apply]`, que só repassa os argumentos para `npx @rojaostudio/ds-codemod`: o `ts-morph` não entra na CLI.
