---
"@rojaostudio/ds-core": patch
---

`generateRdsTheme`: hover e active dos preenchimentos de marca passam a carregar o mesmo texto do preenchimento padrão.

- **Bug:** o `text/on/*` era escolhido (preto ou branco) só contra o tom padrão, e `hover`/`active` saíam escurecendo a rampa sem conferir esse texto. Numa marca clara (ciano #00aeef), o botão de ação com o ponteiro em cima ficava com fundo #005679 e rótulo preto, 2,6:1.
- **Agora** o texto é escolhido primeiro e cada estado precisa passar 4,5:1 com ele: `colors/primary/active` com `text/on/primary`, `colors/secondary/hover` e `colors/secondary/active` com `text/on/secondary`, `colors/accent/hover` com `text/on/accent`, nos modos claro, escuro e chapa. O degrau do template é mantido quando passa; senão o estado anda na rampa na mesma direção até onde o texto ainda passa e, sem espaço, vai para o outro lado (clareia sob texto escuro, escurece sob texto claro). Sempre diferente do tom padrão.
- **`RDS_CONTRAST_PAIRS`** ganha esses quatro pares, e `rdsContrastReport` passa a apontar hover e active abaixo de AA (também nas tabelas de marca).
- O tema da Rojão não muda: vem da tabela do Figma, e o gerador com a receita da Rojão sai igual.
