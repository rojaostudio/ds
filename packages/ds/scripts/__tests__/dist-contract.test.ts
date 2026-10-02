import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

  it.skipIf(!temDist)("o preset do NativeWind continua CJS", () => {
    // O config do consumidor faz require(). Com "type": "module" no pacote, um .js ali
    // seria lido como ESM e o require quebraria.
    expect(existsSync(join(dist, "targets/native/preset.cjs"))).toBe(true);
  });
});
