---
"@rojaostudio/ds-core": minor
"@rojaostudio/ds": minor
---

Papel novo `text/on/success-strong` (`--text-on-success-strong`): branco no claro e no print, preto no escuro e na chapa, o ícone sobre `colors/state/success-strong`. O par entra no relatório de contraste de não-texto (3:1). A tabela `rojao.rds.json` ganha o papel; uma tabela exportada antes dele continua carregando, com aviso. O tema passa a 111 papéis.

Muda aparência: o Tile `tone="success" variant="fill"` passa a usar o fundo `colors/state/success-strong` (green/600 no claro, green/300 no escuro) e o ícone `text/on/success-strong`, com 3:1 ou mais em claro, escuro, chapa e print.
