---
"@rojaostudio/ds-core": minor
---

Tema de uma cor (`generateRdsTheme`, o "Sua cor" do showroom) legível em todos os componentes, em claro, escuro e chapa. As tabelas de marca do Figma (`rdsThemeFromTable`) não mudam.

- **Neutro em tinta neutra.** Com só `brand.primary`, a cor é a ação e o acento; `colors/primary/*` (Button e Badge neutros, barras, Tooltip, dia selecionado) sai de uma tinta neutra da rampa de texto, nunca da cor da marca, e longe o bastante da ação para os dois Buttons não saírem iguais. Antes, o Button neutro era pintado com a marca (branco sobre `#10b981`, 2,53:1) e o inverse levava a marca como rótulo (1,41:1 com amarelo). Receita com `secondary` (a Rojão) mantém a primária como foi dada.
- **Rótulo do neutro pelo fundo real.** `text/on/primary-strong` é escolhido sobre `colors/primary/default` (o preenchimento do Button neutro), não sobre `colors/primary/dark`; o hover (`colors/primary/dark`), o pressionado e o hover do inverse (`colors/primary/light`) carregam esse rótulo em 4,5:1. Na chapa, o Button neutro saía com fundo e texto `#000000`.
- **Chapa.** Pintada com a cor da marca; quando ela fica a menos de 6:1 da tinta (carmim, violeta, cinza), anda na rampa até deixar folga para os hovers. Texto discreto (dica do Input, cabeçalho da Table, rótulos da Sidebar, descrição do Card, eyebrow dos blocos) fica mais opaco até 4,5:1; a borda do campo, até 3:1; as sobreposições usam a outra tinta quando a da chapa não carregaria o texto. Texto de estado (erro do Input, danger outline/ghost) e superfícies suaves vêm do claro numa chapa clara e andam na rampa até 4,5:1. Logos na chapa saem na tinta.
- **Danger.** `colors/state/error-strong`, o hover do Button danger, carrega o rótulo branco no escuro e na chapa (era 2,78:1).
- **Escuro.** A tinta de seleção (`surface/tint/*`) e o destaque do acento escurecem na rampa até carregar o texto (amarelo: 1,91:1 → 4,68:1).
- **Logo.** `logo/primary` e `logo/signature` ficam na cor da marca, escurecida até 3:1 sobre as superfícies claras (amarelo sobre fundo claro: 1,35:1).
- **Relatório maior.** `RDS_CONTRAST_PAIRS` cobre os pares que os componentes juntam; novo `RDS_NON_TEXT_PAIRS` (3:1: borda de campo, borda de erro, foco, logo, série 1). `RdsContrastFailure` ganha `min`. Novo `distinct(a, b)`.
- `emitClaudeMd` descreve os papéis como os componentes os usam: `colors/primary/*` é a tinta neutra (Button e Badge neutros, barras, Tooltip) e `colors/secondary/*` o preenchimento de ação.
- **Teste de regressão** no `@rojaostudio/ds`: nove cores difíceis, tokens de componente resolvidos até a cor final, falha abaixo de 4,5:1 (texto) e 3:1 (interface).
- Na receita da Rojão (gerada, não a tabela) mudam o hover do danger no escuro e na chapa, a tinta de seleção e o destaque do acento no escuro e `text/subtle` na chapa (60% → 65%). Snapshot atualizado.
