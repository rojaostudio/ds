# @rojaostudio/ds

## 1.0.0

**Primeira versão pública.** O pacote sai do GitHub Packages, onde exigia token até para
instalar, e passa a viver no npmjs sob a MIT. As versões `0.x` ficam congeladas no registry
antigo para quem ainda não migrou.

O que mudou entre a `0.34.0` e esta: licença e identidade de pacote, marca de cliente fora do
que é publicado, o motor separado em `@rojaostudio/ds-core` (sem peer dependency nenhuma), e o
fim do TypeScript cru — agora sai ESM com tipos, e funciona fora do Next.

### Minor Changes

- 64d476c: Pré-build: os pacotes deixam de publicar TypeScript cru

  Fecha o #100. Os `exports` apontavam para `.ts` e `.tsx`. Isso só funciona em consumidor que transpila dependência — na prática, Next com `transpilePackages`. Vite, Remix, Astro e Node puro quebravam, e **todo** consumidor pagava a transpilação de 589 kB de TSX em toda build fria. Agora se paga uma vez, na publicação.

  Saída **ESM + `.d.ts`**, com `bundle: false`: cada arquivo de origem vira um arquivo de saída, 1:1. Agrupar destruiria os deep imports (`@rojaostudio/ds/components/button`, o caminho canônico) e misturaria os 54 arquivos com `'use client'` num chunk só, arrastando a fronteira de client sobre componentes que não a têm.

  Duas coisas que o transpilador não faz sozinho, e que quebrariam **na máquina de quem instala**:

  - **`'use client'`** some ao transpilar. Sem ela, o App Router trata componente interativo como Server Component — falha em runtime, com uma mensagem que não aponta para o design system.
  - **Imports relativos sem extensão.** O esbuild emite `from "./alert"`; bundler tolera, o resolvedor ESM do Node não. E Node puro é justamente o consumidor que o pré-build veio atender.

  As duas estão restauradas por `scripts/fix-dist.ts` e **travadas por teste** (`dist-contract.test.ts`): o dist é comparado com a origem arquivo a arquivo.

  O `preset.js` do NativeWind vira `preset.cjs` — com `"type": "module"` no pacote, um `.js` ali seria lido como ESM e o `require()` do config do consumidor quebraria.

  Verificado instalando os dois tarballs num projeto Node ESM vazio, sem bundler e sem `transpilePackages`: `ds-core/generate`, `ds/tokens` e `ds/components/button` resolvem e executam.

- 340548e: Marca de cliente fora do pacote público, e o alvo React Native passa a ser temável

  Fecha o #101. A auditoria achou **quatro** vazamentos onde a issue previa um:

  1. `styles/themes/*.css` — sete temas de produto e de cliente
  2. `recipes/index.ts` — **ia no tarball** com os oito `BrandDef`, ou seja, a cor de marca de cada cliente em código-fonte
  3. `targets/native/theme.ts` — exportava um símbolo com o nome de uma marca específica, gerado da receita dela
  4. `README.md` — tabela de `--brand-primary` por cliente. O npm **sempre** inclui o README no tarball, esteja ou não no `files[]`

  O pacote público passa a carregar só o tema `rojao` e o catálogo de presets genéricos, que não descreve marca de ninguém.

  ## O alvo nativo era o pior dos quatro

  Não era só vazamento: o `DSThemeProvider` estava **cravado numa marca**, sem prop de override. Qualquer app React Native que instalasse o pacote recebia as cores do um produto consumidor e não tinha como trocar — o lado web é temável por classe, o nativo não era temável de jeito nenhum.

  Agora a base é a receita pública e a marca entra por prop:

  ```tsx
  <DSThemeProvider theme={brandTheme}>
  ```

  O símbolo antigo saiu: a API não carrega mais nome de marca.

  ## Para quem consome uma marca

  `pnpm build:brands` gera a entrega em `brands-out/`: o CSS de cada marca e o mapa nativo completo. É assim que o tema sai do pacote e entra no repositório do consumidor, e é como ele é **refeito** quando uma melhoria do motor justifica reentregar.

- 74d63a2: Separa o motor dos componentes: nasce o `@rojaostudio/ds-core`

  Fecha o #99. As `peerDependencies` obrigavam `react`, `react-dom` e `tailwindcss` mesmo para quem só queria os tokens — cliente dependendo do que não usa. A fronteira já existia no código (o motor nunca importou React, e o `emitCss` sempre emitiu CSS puro); passou a existir no empacotamento.

  | pacote                 | conteúdo                                                 | peer dependencies             |
  | ---------------------- | -------------------------------------------------------- | ----------------------------- |
  | `@rojaostudio/ds-core` | tokens, derivação de tema, emissores, receitas, catálogo | **nenhuma**                   |
  | `@rojaostudio/ds`      | componentes, estilos, ícones, alvo React Native          | react, react-dom, tailwindcss |

  **Nada quebra hoje.** Os subpaths antigos — `@rojaostudio/ds/tokens`, `/generate`, `/recipes`, `/themes` — continuam funcionando como reexport depreciado, apontando para o `ds-core`. Saem na próxima major.

  Junto vão duas correções que a separação expôs:

  - **`taxonomy/` fora.** Eram 6 kB de vocabulário de negócio de um produto específico — setores e segmentos — publicados no pacote. O próprio cabeçalho do arquivo dizia "NÃO É publicada no pacote", o que era falso desde que o subpath foi consertado. Ninguém importava.
  - **Arquivo de teste fora do tarball.** Eram 34 dos 48 kB do `ds-core` e nada disso roda na máquina de quem instala.

### Patch Changes

- 51fc204: Licença MIT, marca reservada e identidade de pacote público

  Primeiro passo da abertura (#98). O pacote não tinha licença — sem ela, código público é "olha mas não usa": legalmente ninguém pode.

  - `LICENSE` MIT na raiz e dentro do pacote (entra no `files[]`, então vai no tarball)
  - `TRADEMARK.md` separando código de marca: o nome "Rojão", os logos e os domínios ficam de fora da MIT. Qualquer um usa o código; ninguém publica um fork chamado "Rojão DS"
  - `package.json` ganha `license`, `author`, `homepage`, `repository`, `bugs` e `keywords`

  O `repository` não é cosmético: o npm exige que ele bata com o repo que buildou para verificar a proveniência. Sem ele, `npm publish --provenance` falha.

  **A propriedade do output ficou escrita em dois lugares** — no cabeçalho de todo `theme.css` gerado e na página, ao lado do download. O gerador é MIT; o que sai dele é de quem gerou. Quem recebe um `theme.css` de um colega meses depois não viu a página nenhuma, então a frase viaja com o arquivo.

- 66ed985: Documentação pública: README externo, SECURITY, SUPPORT e CONTRIBUTING

  Fecha o #104. A documentação era interna: o README do `ds` descrevia o repo pra quem já era de casa, e o `consuming.md` ensinava a configurar PAT.

  Os dois READMEs de pacote foram reescritos **em inglês** — eles são publicados no npm, que é registry global, e o npm inclui o `README.md` no tarball esteja ou não no `files[]`. O site continua em português e cada README aponta pra ele.

  Novos na raiz: **SECURITY.md** (canal privado de report, escopo, e o que esperar de prazo — dito honestamente, sem SLA que ninguém está de plantão pra cumprir), **SUPPORT.md** (o que é mantido e o que não é, escrito na entrada em vez de descoberto seis meses depois) e **CONTRIBUTING.md** público, com a regra que mais importa num repositório aberto: nunca `pull_request_target`, nunca secret em workflow que roda código de fork.

  Os sete documentos internos saíram de `docs/` para `private/docs/` — quatro nomeavam clientes e iriam para o repositório público.

- Updated dependencies [66ed985]
- Updated dependencies [64d476c]
- Updated dependencies [74d63a2]
  - @rojaostudio/ds-core@0.35.0

## 0.34.0

### Minor Changes

- be447fd: Contraste: `--text-muted` e `--text-placeholder` atingem AA no modo claro

  Fecha o #109, a parte da correção de contraste que ficou de fora da 0.33.0 por precisar de decisão visual.

  A `--surface-raised` é a **mais escura** das três superfícies claras, e é ela quem manda. Sobre `#ededed` o `neutral-500` dá 4,05 e reprova por pouco; o `600` dá 6,17. Abaixo do `--text-secondary` (700) o `600` é o único degrau que passa — então o `--text-placeholder` aterrissa no mesmo tom.

  - `--text-muted` no claro: 500 → **600**
  - `--text-placeholder` no claro: 400 → **600** (dava 2,80 / 2,92 / 2,49)
  - `--text-placeholder` no escuro: 600 → **300** (dava 2,69 / 2,18 / 1,53)
  - mesmo ajuste nos valores à mão do `base.css`, nos dois modos

  **A escada do texto passa a ter três níveis, não quatro:** `muted` e `placeholder` compartilham o tom. Colapso deliberado — os dois são texto de baixa ênfase que precisa ser lido. O `--text-disabled` continua abaixo do piso de propósito: a WCAG 1.4.3 dispensa componente desabilitado, e é o único dos quatro que pode.

  **Muda aparência.** Legenda, metadado, timestamp e placeholder de campo escurecem no modo claro — que é o modo padrão. O teste de contraste agora cobre os quatro tokens nos dois modos, sem lista de exceção.

## 0.33.0

### Minor Changes

- 32768f3: Contraste: escala de texto do escuro recalibrada e `--surface-invert` ganha origem

  Três defeitos com a mesma raiz — a escala era calibrada contra a página, e a `--surface-raised` (o tom mais claro das três superfícies) nunca entrava na conta.

  - **#91 · #92** — no escuro, `--text-secondary` sobe de 400 para 200 e `--text-muted` de 500 para 300. Sobre `--surface-raised` só 100/200/300 alcançam os 4,5:1 da WCAG 1.4.3; o muted estava no 500, o mesmo degrau do claro, e era o único token de texto que não invertia. O mesmo ajuste vai pro bloco escuro do `base.css`.
  - **#93** — `--surface-invert` passa a ser derivado nos dois modos. O `base.css` exportava o utilitário `--color-surface-invert` sem que nenhum tema neutro ou chromatic definisse a origem: `bg-surface-invert` não pintava nada e o par com `--text-inverse` dava 1:1. Atinge `Card` variante `invert`, `PricingCard` em destaque e `ToggleGroup` selecionado.

  **Muda aparência.** Todo texto de apoio no modo escuro fica mais claro, e as três superfícies invertidas passam a pintar. Olhar antes de subir a versão nos projetos.

  Fica de fora, medido e registrado no #109: `--text-muted` reprova por pouco no modo **claro** sobre `--surface-raised` (4,03–4,49) e `--text-placeholder` reprova nos dois modos.

### Patch Changes

- 5d77fd1: Foco visível como padrão do sistema

  O DS não definia foco em lugar nenhum além do slider. Todo produto que o
  consome herdava o outline do navegador, que qualquer `border` ou `border-radius`
  acaba encobrindo — e uma tela inteira navegada por teclado sem indicação de
  posição viola o 2.4.7 (WCAG AA) por omissão do sistema, não por descuido de quem
  consome.

  A regra usa `:focus-visible`, então o anel aparece para quem navega por teclado
  e não para quem clica com o mouse. O seletor é envolvido em `:where()`, de
  especificidade zero: qualquer componente que já resolva o próprio foco continua
  vencendo sem precisar de `!important`.

  A cor sai de `--border-focus`, que já existia e já inverte entre os temas — um
  produto com chrome escuro sobre tema claro redefine o token no escopo daquela
  superfície, sem tocar na regra.

## 0.32.0

### Minor Changes

- a24d4f5: a11y: borda de controle com 3:1 — novo token `--border-control` (#87).

  O `Input` desenhava o campo com `--border-default`, que dá **1,45:1** sobre a superfície branca
  em qualquer marca. A WCAG 2.2 SC 1.4.11 pede 3:1 para o que identifica um componente de
  interface, e num campo vazio, sem foco, a borda é exatamente isso. Não dependia da cor de quem
  usa — era dívida da base, e valia para todos os consumidores.

  O motor passa a emitir `--border-control` nos três caminhos (light, dark e mix), com o alias
  `stroke-control` no `@theme`. No claro é o step 500 da família de texto (4,74:1 — o 400 dá 2,92
  e falha por um triz); no escuro, branco a 40% (3,71:1).

  Migram para ele os 14 componentes que são **controle**: input, select, textarea, checkbox,
  radio, combobox, date-picker, currency-input, color-input, chip-input, phone-input, search,
  dropzone e toggle. Os outros 26 seguem com `--border-default` — card, accordion, badge, drawer
  e afins são decoração, onde borda sutil é escolha legítima e o critério não se aplica.

  **Mudança visível:** a borda dos campos fica mais escura. É o preço dos 3:1, e a alternativa era
  manter um campo que alguém com baixa visão não enxerga. Os temas gerados continuam
  byte-idênticos fora a linha nova do token (`validate:themes` reproduz 8/8), e um teste trava o
  contraste nas famílias neutras reais do DS.

### Patch Changes

- 06c817a: fix(generate): `emitClaudeMd` mandava linkar uma URL morta.

  Sem `cssUrl`, o arquivo gerado trazia `<link rel="stylesheet" href="https://ds.rojao.ai/themes/<slug>.css">`
  — o serving de tema por conta, que saiu para o studio junto com o resto do editor. A rota responde
  404, então todo `CLAUDE.md` entregue pelo site público mandava o leitor apontar para um arquivo
  que não existe. Pior: a instrução seguinte prometia que editar no painel atualizaria "todos os seus
  apps de uma vez", o que não vale mais para quem gera de fora.

  Agora, sem `cssUrl`, o arquivo instrui a importar o `theme.css` local — que é baixado junto — e
  diz o que passou a ser verdade: o tema é um arquivo do consumidor, sem dependência de host. Quem
  tem serving próprio segue passando `cssUrl` e recebe o bloco de link ao vivo, inalterado.

## 0.31.0

### Minor Changes

- 899f0e8: Motor de cor: remove os tokens `--brand-secondary-sunken` e `--brand-on-secondary-sunken` (#44).

  Depois do épico de cor do um produto consumidor (#523 / 0.29.0), a banda de identidade das faces (Bio + vitrine)
  passou a usar a secondary **literal** e todos os consumidores migraram — os dois tokens viravam
  dead output em todo tema gerado, junto com a lógica que só existia pra alimentá-los
  (`surfaceable`/`darkenSunken` no dark, e os helpers `mixHex`/`onSecondarySunken`).

  `--brand-secondary-surface` e `--brand-secondary-band` continuam idênticos: o diff dos 8 temas
  gerados, ignorando o realinhamento de whitespace, é só a remoção das linhas do sunken. Um teste
  trava a ausência dos tokens. O target native perde o skip que descartava o sunken na resolução.

### Patch Changes

- 28eeb78: fix(color): `--brand-hover` saía igual a `--brand-primary` em marcas com cor custom.

  `brandTones` recalculava o passo da cor na escala por luminância (`nearestStep`), enquanto o
  `buildScale` crava a cor por outro critério (piso adaptativo + âncora de croma). Quando os dois
  divergiam em um step — o que acontece em cerca de metade das cores testadas — o "próximo step"
  caía exatamente sobre a própria cor, e o botão ficava sem nenhum feedback de hover.

  O passo agora vem de onde a cor foi **efetivamente cravada** na escala, com o cálculo por
  luminância como fallback. Uma bateria de 12 cores trava o comportamento, incluindo os extremos
  (quase-preto precisa clarear, quase-branco precisa escurecer).

  Afeta só marca **custom** (hex): os 8 temas curados usam `ColorRef`, não passam por `brandTones`,
  e seguem byte-idênticos — `validate:themes` reproduz 8/8 diff-clean.

- 899f0e8: fix(pack): publica a pasta `taxonomy` — o subpath `@rojaostudio/ds/taxonomy` estava quebrado.

  O `exports` mapeia `./taxonomy` desde que o subpath existe, mas `files` nunca listou a pasta: o
  tarball ia sem ela em **todas** as versões publicadas. O import resolvia pelo package.json e
  estourava em disco. Ficou invisível porque o único consumidor era o `ds-www` via `workspace:*`,
  que resolve pela pasta real e mascara o defeito — apareceu no primeiro consumidor de fora.

  Um teste passa a travar a coerência: todo diretório alvo de `exports` precisa estar em `files` e
  existir em disco.

## 0.30.1

### Patch Changes

- 3e977d7: perf: remove CSS morto do PhoneInput e declara `sideEffects` (#63).

  O `PhoneInput` importava `react-international-phone/style.css` desde que foi escrito, com um
  comentário afirmando que as bandeiras dependiam dele. Não dependiam: o componente descartou o
  dropdown da lib e usa o `Combobox` do DS, então nenhum dos seletores do arquivo é renderizado; e o
  `FlagImage` aplica `width`/`height` inline e busca a bandeira por URL do twemoji, não por sprite.
  Eram 8 KB de CSS render-blocking em toda rota que toca o componente, inclusive o checkout da
  vitrine do um produto consumidor.

  O pacote passa a declarar `sideEffects` em forma de array (`["**/*.css", "./styles/**"]`), o que
  libera o bundler do consumidor a remover módulos do grafo. Em array, e não `false`: o
  `ImageCropModal` importa `ReactCrop.css` de verdade, e `false` autorizaria o bundler a dropar esse
  import, quebrando o estilo em produção sem quebrar em dev. Um teste trava as duas coisas.

## 0.30.0

### Minor Changes

- 89347ae: uma marca: tema migrado de brasa para navy. Navy + laranja + branco, LIGHT-first, Inter + Bricolage. Dark profundo (#0E1626) e accent laranja cheio (flare-700), alinhado à identidade Rojão da home do um consumidor. Afeta os consumidores do tema `uma marca` (um consumidor e site uma marca).

## 0.29.0

### Minor Changes

- f09caf3: Motor de cor: fill da marca LITERAL (não reancora) + affordance opt-in

  - `--brand-primary` (e o par no dark) agora é emitido LITERAL: a cor da marca é intenção
    do consumidor e nunca é reancorada pra contrastar com a superfície (preto fica preto). O
    contraste continua garantido onde pertence — no `--brand-on-primary` (texto sobre o fill,
    derivado por WCAG) e no `--brand-text` (marca usada como texto). Reverte o guarda DS-1 que
    empurrava a própria cor da marca.
  - Novo token `--brand-primary-border`: hairline de affordance emitido SÓ quando o fill da
    marca quase encosta na superfície (contraste < 2). O `Button` filled/primary consome
    `border-[var(--brand-primary-border,transparent)]` — zero mudança nos botões que já
    contrastam; nos que sumiriam, um contorno translúcido (on-primary a 60%) sem tocar na cor.

## 0.28.0

### Minor Changes

- bc0700c: Motor de cor: escala de marca, resolveTheme e derivação harmônica (épico um produto consumidor#523)

  - **#27** — escala de marca canônica `--brand-primary-50..900` emitida pelo motor (hex → buildScale; ref de paleta → `--color-<paleta>-<step>`). Aditiva: consumidores param de reimplementar a paleta.
  - **#28** — `resolveTheme(recipe, { mode }) → { tokens, isDark }`: contrato único de derivação + modo (funde light+dark), tirando as cópias de fusão dos consumidores. A política de modo continua no consumidor.
  - **#29** — derivação harmônica de `secondary`/`accent` quando ausentes: a partir da `primary` hex, pela roda de cor (análoga + split-complementar) com clamp de saturação/luminância. Temas curados (3 papéis) passam intactos.

## 0.27.0

### Minor Changes

- theme: guarda de contraste INCONDICIONAL no override de marca (#26). Quando a marca do modo escuro vem como hex cru (override de leigo via consumidor), o motor reancora por surfaceSafeHex e deriva hover/on por WCAG — o override não fura mais o guarda, e o CTA nunca fica invisível no dark. Marca curada (ref de paleta) segue respeitada. Preserva o hue (identidade).

## 0.26.1

### Patch Changes

- toast: duração default segue o Material Design (Snackbar) — 1500ms (LENGTH_SHORT) para confirmações curtas e 2750ms (LENGTH_LONG) quando há ação ou em erros (mensagem precisa ser lida). Reduz o tempo em tela. O valor é só um FALLBACK: cada toast pode sobrescrever com `toast.x(msg, { duration })` sem republicar o DS. Target native alinhado (default único 2750).

## 0.26.0

### Minor Changes

- d085da6: Migrate the design system into the rojao monorepo (Turborepo + pnpm workspaces). Now published from `rojaostudio/rojao` instead of the archived `rojaostudio/rojao-ds`. No public API changes — consumers keep importing `@rojaostudio/ds`.
