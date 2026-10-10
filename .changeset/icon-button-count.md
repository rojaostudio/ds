---
"@rojaostudio/ds": minor
---

IconButton ganha `count` e `countLabel` (#53): uma pílula danger no canto superior direito, 4 além da borda, com "99+" acima de 99, que some com 0 ou `undefined`. O número real entra no nome acessível depois do `label`, e o `countLabel` diz o que ele conta: `label="Notificações" count={3} countLabel="não lidas"` vira "Notificações, 3 não lidas" (sem `countLabel`, "Notificações, 3"). Funciona também com `asChild`. Tokens novos na coleção Actions: `button/count/background` (colors/state/error) e `button/count/label` (text/on/error).
