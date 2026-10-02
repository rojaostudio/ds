---
"@rojaostudio/ds": patch
---

Chart: a tabela alternativa (para leitor de tela) não estica mais a rolagem da página. Uma `<table>` ignora o recorte de 1px do `.rds-visually-hidden`; agora a tabela fica dentro de um wrapper oculto, e o gráfico é o ancestral posicionado.
