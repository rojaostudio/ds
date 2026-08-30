// Recusa `npm publish` nos pacotes deste workspace. Só o pnpm serve.
//
// O npm NÃO substitui `workspace:*` pela versão real ao empacotar: o tarball sai com
// "@rojaostudio/ds-core": "workspace:*" nas dependências, e quem instala toma
// EUNSUPPORTEDPROTOCOL. Aconteceu de verdade no 1.0.0 do @rojaostudio/ds, que teve que ser
// despublicado. O `pnpm check:pack` pega isso — mas só quando roda, e um publish manual
// passa por fora dele. Este guard roda DENTRO do publish, que é onde não dá pra escapar.
const ua = process.env.npm_config_user_agent ?? "";
if (!ua.includes("pnpm/")) {
  console.error(`
  ✗ Use \`pnpm publish\`, não \`npm publish\`.

    O npm não resolve "workspace:*" ao empacotar e publica um tarball que não instala
    (EUNSUPPORTEDPROTOCOL). Foi assim que o @rojaostudio/ds@1.0.0 nasceu quebrado.

    cliente detectado: ${ua || "(desconhecido)"}
`);
  process.exit(1);
}
