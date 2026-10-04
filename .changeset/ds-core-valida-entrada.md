---
"@rojaostudio/ds-core": minor
---

O motor valida a entrada antes de escrever (API pública: recipe, tabela do Figma e tema montado à mão).

- **Cores em lista branca.** Toda cor emitida (valores de papel, `primitives` da tabela, `palettes` da receita, hex ou escala 50–900) só passa se for hex (`#rgb` a `#rrggbbaa`) ou `rgb()`/`rgba()`/`oklch()` fechados. Um valor que feche a regra CSS, puxe `url()` ou traga `;`, chaves ou quebra de linha é recusado com erro listando o campo (`RdsValidationError`).
- **Nomes e fonte.** Nomes de variável e de primitivo (`vars`, chaves) em `^[a-z0-9]+(?:[/-][a-z0-9]+)*$`; a fonte mono sem aspas, `;`, chaves, `\` ou quebra de linha.
- **`emitRdsCss` revalida** o tema inteiro e os seletores (`scope`, `dark`, `plate`) antes de interpolar qualquer coisa.
- **`emitClaudeMd`**: a `description` vira uma linha só, sem `<`, `>`, crase ou marcador, com até 200 caracteres; nome, `cssFile`, `cssUrl` e o tema passam pela mesma validação, e o texto gerado nunca contém os marcadores `rojao-ds:start/end`. Nova opção `install`: o comando de instalação mostrado no setup (padrão `pnpm add @rojaostudio/ds`).
- Exporta `isSafeColor`, `isSafeVarName`, `isSafeFont` e `RdsValidationError`.

Um tema com valor fora da lista (ex.: `transparent` literal numa tabela) passa a falhar: use hex ou `rgb()`/`oklch()`.
