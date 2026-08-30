import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// (cópia do gate do @rojaostudio/ds — a #99 criou um segundo pacote, e o mesmo defeito
// pode nascer aqui.)
// Um subpath em `exports` que aponta pra um arquivo ausente publica um pacote com o caminho
// mapeado e o arquivo fora: o import resolve pelo package.json e estoura em disco. Aconteceu
// com `./taxonomy`, quebrado em TODAS as versões publicadas até a 0.31.0 — invisível aqui
// dentro, porque `workspace:*` resolve pela pasta real e mascara o defeito.
//
// Com o pré-build da #100 o gate ficou mais forte: antes conferia a PASTA em `files[]`, agora
// confere o ARQUIVO em disco. `./components` apontando pra um dist que não foi gerado passa no
// teste antigo e falha neste.
const root = join(__dirname, "..", "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  exports: Record<string, string | Record<string, string>>;
  files: string[];
};

/** Todo caminho de arquivo citado no `exports`, seja string ou mapa de condições. */
function alvos(v: string | Record<string, string>): string[] {
  return typeof v === "string" ? [v] : Object.values(v);
}

const entradas = Object.entries(pkg.exports);
const incluidos = pkg.files.filter((f) => !f.startsWith("!"));

describe("empacotamento — todo export existe e é publicado", () => {
  for (const [subpath, valor] of entradas) {
    // `./components/*` é padrão, não arquivo: a existência é coberta pelo `./components`.
    if (subpath.includes("*")) continue;

    for (const alvo of alvos(valor)) {
      it(`${subpath} → ${alvo} existe em disco`, () => {
        expect(existsSync(join(root, alvo)), "rode `pnpm build`").toBe(true);
      });

      it(`${subpath} → ${alvo} está sob um diretório de files[]`, () => {
        const topo = alvo.replace(/^\.\//, "").split("/")[0];
        expect(incluidos).toContain(topo);
      });
    }
  }

  it("nenhum arquivo de teste nos diretórios publicados", () => {
    // Eram 34 dos 48 kB do ds-core, e nada disso roda na máquina de quem instala. A invariante
    // é o CONTEÚDO do que vai no tarball, não a forma como ele é excluído: com o pré-build da
    // #100 a exclusão passou a vir da entry do tsup, não mais de uma negação em files[].
    const achados: string[] = [];
    const varrer = (dir: string) => {
      if (!existsSync(dir) || !statSync(dir).isDirectory()) return; // files[] tem arquivo solto
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) varrer(p);
        else if (/\.test\.|__tests__/.test(p)) achados.push(p.replace(root, ""));
      }
    };
    for (const dir of incluidos) varrer(join(root, dir));
    expect(achados).toEqual([]);
  });
});
