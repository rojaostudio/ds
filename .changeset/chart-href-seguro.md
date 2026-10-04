---
"@rojaostudio/ds": patch
---

`Chart`: `hrefs` só são seguidos quando são `http(s):`, caminho relativo ou `#fragmento`. Outro esquema (`javascript:`, `data:`…) é ignorado, no link da barra, na tabela e no Enter da coluna, com aviso no console em desenvolvimento.
