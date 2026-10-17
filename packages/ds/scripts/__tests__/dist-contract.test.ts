import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

// O contrato do pré-build (#100). São dois defeitos que NÃO quebram aqui dentro e quebram na
// máquina de quem instala — a pior categoria, porque a mensagem de erro não aponta pra cá.
//
//  1. `'use client'` sumindo: o App Router passa a tratar componente interativo como Server
//     Component. Falha em runtime, no consumidor.
//  2. Import relativo sem extensão: bundler tolera, o resolvedor ESM do Node não. E Node puro
//     é justamente o consumidor que o pré-build veio atender — se ele não funciona, a #100
//     não entregou nada.
const raiz = join(__dirname, "..", "..");
const dist = join(raiz, "dist");
const DIRETIVA = /^\s*(['"])use (client|server)\1;?/;

function varrer(dir: string, ext: RegExp, saida: string[] = []): string[] {
  if (!existsSync(dir)) return saida;
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (!p.includes("__tests__")) varrer(p, ext, saida); }
    else if (ext.test(p)) saida.push(p);
  }
  return saida;
}

const temDist = existsSync(dist);

describe("contrato do dist", () => {
  it("o dist existe — sem ele o pacote publica nada", () => {
    expect(temDist, "rode `pnpm build` antes").toBe(true);
  });

  it.skipIf(!temDist)("toda origem com 'use client' tem a diretiva no dist", () => {
    const semDiretiva: string[] = [];
    for (const origem of varrer(join(raiz, "components"), /\.tsx?$/)) {
      if (!DIRETIVA.test(readFileSync(origem, "utf8"))) continue;
      const alvo = origem.replace(join(raiz, "components"), join(dist, "components")).replace(/\.tsx?$/, ".js");
      if (!existsSync(alvo) || !DIRETIVA.test(readFileSync(alvo, "utf8"))) semDiretiva.push(alvo);
    }
    expect(semDiretiva).toEqual([]);
  });

  it.skipIf(!temDist)("nenhum import relativo sai sem extensão", () => {
    const ruins: string[] = [];
    for (const arquivo of varrer(dist, /\.js$/)) {
      const conteudo = readFileSync(arquivo, "utf8");
      for (const m of conteudo.matchAll(/from\s*["'](\.[^"']*)["']/g)) {
        if (!/\.(js|cjs|mjs|json|css)$/.test(m[1])) ruins.push(`${arquivo} → ${m[1]}`);
      }
    }
    expect(ruins.slice(0, 10)).toEqual([]);
  });

  it.skipIf(!temDist)("o JSX sai no runtime automático, não no clássico", () => {
    // O transform clássico emite `React.createElement` e NÃO injeta o import. 40 dos 83
    // componentes saíram assim na 1.0.1 e estouraram `ReferenceError: React is not defined`
    // no servidor de quem instalou — produção fora do ar. Invisível no monorepo, onde quem
    // transpilava era o Next, com o runtime automático. Ver #5.
    const classicos: string[] = [];
    for (const arquivo of varrer(join(dist, "components"), /\.js$/)) {
      if (/React\.createElement/.test(readFileSync(arquivo, "utf8"))) {
        classicos.push(arquivo.replace(raiz, ""));
      }
    }
    expect(classicos.slice(0, 5)).toEqual([]);
  });

  it.skipIf(!temDist)("todo módulo sem 'use client' carrega como Server Component", () => {
    // Sem a diretiva, o App Router importa o módulo no servidor, com o React de servidor: lá não existem
    // createContext, useState nem useContext. O FieldGroup saiu assim na 2.15.0 e quebrava no import.
    // O loader troca cada módulo 'use client' por uma referência vazia, como o Next: só o grafo de servidor roda.
    const servidor = readdirSync(join(dist, "components"))
      .filter((f) => f.endsWith(".js") && f !== "index.js")
      .map((f) => join(dist, "components", f))
      .filter((f) => !DIRETIVA.test(readFileSync(f, "utf8")));
    const urls = JSON.stringify(servidor.map((f) => pathToFileURL(f).href));
    const script = `const falhas = []; for (const u of ${urls}) { try { await import(u); } catch (e) { falhas.push(u.split("/").pop() + ": " + String(e.message).split(/\\r?\\n/)[0]); } } console.log(JSON.stringify(falhas));`;
    const loader = pathToFileURL(join(__dirname, "react-server-loader.mjs")).href;
    const registrar = `data:text/javascript,import { register } from "node:module"; register(${JSON.stringify(loader)});`;
    const saida = execFileSync(process.execPath, ["--conditions=react-server", "--import", registrar, "--input-type=module", "-e", script], {
      cwd: raiz,
      encoding: "utf8",
    });
    expect(JSON.parse(saida.trim().split(/\r?\n/).pop()!)).toEqual([]);
  });

  it.skipIf(!temDist)("o preset do NativeWind continua CJS", () => {
    // O config do consumidor faz require(). Com "type": "module" no pacote, um .js ali
    // seria lido como ESM e o require quebraria.
    expect(existsSync(join(dist, "targets/native/preset.cjs"))).toBe(true);
  });
});
