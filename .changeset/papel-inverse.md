---
"@rojaostudio/ds-core": minor
"@rojaostudio/ds": minor
---

Papéis novos no tema, para o Card inverso: `surface/inverse`, `text/on-inverse` e `text/on-inverse-subtle` (`--surface-inverse`, `--text-on-inverse`, `--text-on-inverse-subtle`).

- **Claro e print:** o fundo é a primária da marca quando o branco passa 4,5:1 sobre ela; senão (uma marca clara, como um ciano), coal/900. Texto branco; subtítulo branco a 70%, mais opaco de 5 em 5% quando 70% não passa 4,5:1 sobre o fundo (um violeta, um verde médio).
- **Escuro e chapa:** fundo branco, texto coal/900, subtítulo coal/600.
- Na Rojão: navy/900 no claro. A tabela `rojao.rds.json` ganha os três papéis; uma tabela exportada antes deles continua carregando, com os papéis tirados da mesma regra e um aviso pedindo a reexportação.
- O par `text/on-inverse` sobre `surface/inverse` entra no relatório de contraste. O tema passa de 107 para 110 papéis.
