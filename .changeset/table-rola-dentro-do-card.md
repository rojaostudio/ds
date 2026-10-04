---
"@rojaostudio/ds": patch
---

Table: uma tabela larga dentro de um Card a 390 rola em vez de cortar. A causa estava na própria Table: a região de rolagem (`.rds-table`, `overflow-x: auto`) era um bloco comum e repassava o min-content da tabela aos ancestrais. Qualquer ancestral dimensionado pelo conteúdo (o main do app como item flex sem `min-width: 0`, item de grid em trilha auto, pilha alinhada ao início, inline-block) crescia até a largura da tabela, o Card passava da tela e era cortado. Agora `.rds-table` é uma grade de uma coluna `minmax(0, 1fr)`: sob min-content a trilha é 0 (não empurra ninguém), sob max-content é a largura da tabela (quem abraça o conteúdo continua abraçando a tabela inteira no desktop) e com largura definida ela preenche e a tabela rola por dentro. Card não mudou.
