/**
 * fix-dist.ts — as duas correções que o transpilador não faz sozinho (#100).
 *
 * 1. DIRETIVAS. `'use client'` no topo do arquivo é o que faz o App Router tratar um
 *    componente como interativo. Se ela some, 54 componentes viram Server Component e a falha
 *    aparece em runtime, na máquina do consumidor, com uma mensagem que não aponta pra cá. O
 *    esbuild preserva em `bundle: false`, mas isso não está em contrato nenhum — este passo é
 *    a rede, e o teste é quem garante.
 *
 * 2. EXTENSÃO NOS IMPORTS RELATIVOS. O esbuild emite `from "./alert"`. Bundler tolera; o
 *    resolvedor ESM do Node, não — e Node puro é justamente o consumidor que o pré-build veio
 *    atender. A extensão é resolvida olhando o disco: `./x` vira `./x.js` se o arquivo existe,
 *    ou `./x/index.js` se for pasta. Sem adivinhação.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";

const DIRETIVA = /^\s*(['"])use (client|server)\1;?/;
const ESPECIFICADOR = /(\bfrom\s*|(?<!\w)import\s*|\bexport\s*\*\s*from\s*)(["'])(\.[^"']*)\2/g;
const TEM_EXTENSAO = /\.(js|cjs|mjs|json|css)$/;

function arquivos(dir: string, saida: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) arquivos(p, saida);
    else if (p.endsWith(".js")) saida.push(p);
  }
  return saida;
}

/** Resolve um especificador relativo para um caminho com extensão, olhando o disco. */
export function resolverEspecificador(arquivo: string, spec: string): string {
  if (TEM_EXTENSAO.test(spec)) return spec;
  const base = resolve(dirname(arquivo), spec);
  if (existsSync(`${base}.js`)) return `${spec}.js`;
  if (existsSync(join(base, "index.js"))) return `${spec}/index.js`;
  return spec; // não resolveu: deixa como está em vez de inventar
}

const origens = new Map<string, string>();
function mapearOrigens(dir: string) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) { if (!p.includes("__tests__")) mapearOrigens(p); continue; }
    if (!/\.tsx?$/.test(p) || /\.test\.tsx?$/.test(p)) continue;
    origens.set(join("dist", p.replace(/\.tsx?$/, ".js")), p);
  }
}
for (const raiz of ["components", "icons", "targets", "compat"]) if (existsSync(raiz)) mapearOrigens(raiz);

let diretivas = 0, extensoes = 0;
for (const alvo of arquivos("dist")) {
  let conteudo = readFileSync(alvo, "utf8");
  const antes = conteudo;

  conteudo = conteudo.replace(ESPECIFICADOR, (todo, pre, aspa, spec) => {
    const novo = resolverEspecificador(alvo, spec);
    if (novo !== spec) extensoes++;
    return `${pre}${aspa}${novo}${aspa}`;
  });

  const origem = origens.get(alvo.split("\\").join("/"));
  if (origem && !DIRETIVA.test(conteudo)) {
    const m = readFileSync(origem, "utf8").match(DIRETIVA);
    if (m) { conteudo = `${m[1]}use ${m[2]}${m[1]};\n${conteudo}`; diretivas++; }
  }
  if (conteudo !== antes) writeFileSync(alvo, conteudo);
}
console.log(`fix-dist: ${extensoes} import(s) com extensão · ${diretivas} diretiva(s) restaurada(s)`);
