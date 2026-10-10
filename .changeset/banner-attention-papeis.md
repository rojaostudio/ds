---
"@rojaostudio/ds-core": minor
"@rojaostudio/ds": minor
---

Banner attention segue o Figma [RDS]: os fundos vêm de três papéis novos do tema, `surface/attention/low` (amber/100, #fff2d6), `surface/attention/medium` (amber/200, #ffe3ab) e `surface/attention/high` (amber/400, #ffc107), com o mesmo valor no claro, no escuro e na chapa, para toda marca. O texto dos três níveis é `banner/attention/text` (text/on/warning, preto). O `color-mix` do medium sai. O CTA continua outline em low e medium e fill em high. No ds-core, o gerador e a tabela da marca rojao ganham os três papéis, e uma tabela exportada antes deles carrega o âmbar fixo com um aviso para exportar de novo. Tokens do componente: `banner/attention/{low,medium,high}/background` passam a apontar para `surface/attention/*`, `banner/attention/medium/background` e `banner/attention/text` são novos, e saem `banner/attention/low/text`, `banner/attention/medium/text` e `banner/attention/high/text`.
