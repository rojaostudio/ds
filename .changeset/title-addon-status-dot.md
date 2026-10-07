---
'@rojaostudio/ds': minor
---

PageHeader ganha `titleAddon`: um selo logo depois do título (e da ajuda), centrado na linha do título; no estreito quebra para baixo dele, 4 abaixo. Status ganha `dotColor`: com `tone="neutral"`, o ponto aceita cor própria para categoria ou etapa, com chapa e texto neutros. Figma [RDS] 06/10: `showTitleAddon` + slot `titleAddon` no PageHeader; descrição do Status com a exceção do ponto.

No mesmo PageHeader: o título e o "?" andam juntos (no estreito quebra o texto do título e o "?" fica ao lado, nunca sozinho na linha de baixo), e a prop nova `compactTitle="inline" | "bar"` (#50): com `bar`, abaixo de 1024 o voltar, o título e o "?" saem (a barra do app passa a ser a dona deles; o `<h1>` continua para leitores de tela) e ficam o selo, a descrição, as abas e as ações. Padrão `inline`: nada muda para quem já usa.
