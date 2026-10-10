---
"@rojaostudio/ds-core": minor
---

Papel novo `text/selected` (`--text-selected`): o texto e o ícone de um item selecionado. Vale `colors/primary/default` do modo (claro, escuro, chapa e print). Quando a primária não passa 4,5:1 sobre os tints da seleção (`surface/tint/default` e `surface/tint/subtle`), o gerador desce pela rampa da própria primária até o degrau mais próximo que passa: uma primária clara como `#00aeef` fica no seu 700 no claro. O par entra no relatório de contraste. A tabela `rojao.rds.json` ganha o papel; uma tabela exportada antes dele continua carregando, com o papel tirado de `colors/primary/default` de cada modo e um aviso pedindo a reexportação. O tema passa a 112 papéis.
