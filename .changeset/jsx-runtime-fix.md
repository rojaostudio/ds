---
"@rojaostudio/ds": patch
---

Corrige `ReferenceError: React is not defined` no servidor do consumidor

A `1.0.1` saiu com o JSX compilado no **transform clássico**: 83 componentes chamando `React.createElement`, e só 43 importando React. Os outros 40 estouravam em runtime, no SSR de quem instalou.

O `tsconfig` declara `jsx: preserve` — correto quando o Next compila a fonte, que era o caso no monorepo. Com o pré-build da #100, quem transpila passou a ser o esbuild, que caiu no clássico e não injeta o import. **Trocar quem transpila trocou o resultado**, e o monorepo não tinha como mostrar isso: lá o Next lia o `.tsx` e usava o runtime automático.

Agora o build força `jsx: "automatic"`, e o `dist-contract.test.ts` falha se um `React.createElement` reaparecer no `dist`.
