---
"@rojaostudio/ds-codemod": minor
---

Codemod com menos casos manuais e migração parcial (ds#141).

- **Select:** `options={[…]}` literal ou `options={lista.map((o) => ({ value, label }))}` viram filhos `<SelectItem>`, e `<option value>` vira `<SelectItem>` no lugar; `onChange={(e) => set(e.target.value)}` vira `onValueChange={set}` (um método vira `(value) => obj.set(value)`). A primeira opção com `value=""` desabilitada vira `placeholder`; um `value=""` escolhível fica manual, porque no Radix o vazio é o estado sem escolha. Options de variável, prop nativa do `<select>` (`onBlur`…) e onChange que usa o evento seguem manuais.
- **Table:** TableHead (o thead) → TableHeader, Th → TableHead e Td → TableCell numa passada só, `align` left/right → start/end. `caption`, agora obrigatório, fica como caso manual (TODO acima do `<Table>`). `align="center"`, `muted`/`bold` do Td e o `onClick` do TableRow (que perde o teclado do 1.x) seguem manuais e seguram as três células juntas; `header` e `noHover` do TableRow saem.
- **ToggleGroup:** `options={[…]}` literal → `<ToggleGroupItem value>`, `onChange` → `onValueChange` com a regra antiga de desmarcar (`type="single"` explícito, `"multi"` → `"multiple"`, `allowDeselect` → `valor || null`). Sem `aria-label`, opção só com ícone, `size="lg"`, `label` e `stretch` ficam manuais.
- **Button `variant="link"`** com um único filho `<a>` ou `Link` → `asChild variant="ghost"`.
- **buttonVariants** no `className` de um `<a>` ou `Link` → `<Button asChild>` em volta, com variant/color/size/fullWidth/className lidos pelas regras do Button; o import sai quando não sobra uso e o Button entra.
- **`--include <glob>`** (repetível): reescreve só o código que bate e não mexe em `package.json`, `.npmrc`, `next.config` nem no CSS global; o relatório diz o que ficou de fora e por quê. O README ganha "Migração parcial (0.x e 2.x no mesmo app)": a 2.x por tarball do npmjs com o `ds-core` num override (o alias `npm:` cai no GitHub Packages quando o escopo aponta para lá) e o `rds.css` só no layout do segmento.
