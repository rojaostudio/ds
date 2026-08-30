/**
 * check-pack.ts — o gate do tarball (#105).
 *
 * Empacota de verdade e inspeciona o resultado. Não confia no `files[]`: confia no que saiu.
 *
 * Existe porque três defeitos desta família já chegaram a versões publicadas:
 *   - `./taxonomy` mapeado em `exports` com o arquivo fora de `files[]` — quebrado em TODAS as
 *     versões até a 0.31.0, invisível aqui dentro porque `workspace:*` resolve pela pasta real
 *   - vocabulário de negócio de um cliente publicado por 6 kB (#99)
 *   - 34 dos 48 kB do ds-core eram arquivo de teste (#100)
 *
 * Usa `pnpm pack`, não `npm pack`: o npm deixa `workspace:*` nas dependências e produz um
 * tarball que não instala. Isso também é verificado aqui.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

type Regra = { pacote: string; tetoKB: number };

const REGRAS: Regra[] = [
  { pacote: "@rojaostudio/ds-core", tetoKB: 80 },
  { pacote: "@rojaostudio/ds", tetoKB: 400 },
];

// Padrões estruturais: valem em qualquer cópia deste repositório.
const PROIBIDOS: RegExp[] = [/private\//i, /__tests__/, /\.test\.[tj]sx?$/];

// A lista de NOMES de marca vive fora do código, em `private/`, e é opcional.
//
// O motivo é o próprio ponto da #101: uma denylist de clientes escrita no fonte publica os
// nomes dos clientes — o gate que impede o vazamento seria o vazamento. Onde o arquivo existe
// (a bancada), o gate confere nome e estrutura; onde não existe (o repositório público), ele
// confere estrutura, que é o que importa lá.
const listaPrivada = join(process.cwd(), "packages", "ds", "private", "forbidden-names.json");
if (existsSync(listaPrivada)) {
  for (const nome of JSON.parse(readFileSync(listaPrivada, "utf8")) as string[]) {
    PROIBIDOS.push(new RegExp(nome, "i"));
  }
}

let falhas = 0;
const tmp = mkdtempSync(join(tmpdir(), "rojao-pack-"));

for (const { pacote, tetoKB } of REGRAS) {
  // Invocar pnpm de dentro de um script e chato em dois sistemas por motivos opostos: no
  // Linux (o CI) `execFileSync("pnpm")` resolve direto; no Windows o binario e um shim que so
  // o shell acha, e o Node 20+ recusa .cmd sem shell. Tenta o caminho limpo, cai pro shell se
  // preciso. Os argumentos sao constantes deste arquivo, entao o shell nao abre superficie.
  const args = ["--filter", pacote, "pack", "--pack-destination", tmp];
  try {
    execFileSync("pnpm", args, { stdio: "pipe" });
  } catch {
    execFileSync("pnpm", args, { stdio: "pipe", shell: true });
  }
  const tgz = readdirSync(tmp).find((f) => f.endsWith(".tgz"));
  if (!tgz) {
    console.error(`✗ ${pacote}: pnpm pack não produziu tarball`);
    falhas++;
    continue;
  }
  const caminho = join(tmp, tgz);

  // `cwd` + nome relativo em vez do caminho absoluto: no Git Bash o tar lê "C:\..." como host
  // remoto ("Cannot connect to C") e falha. Relativo funciona nos dois sistemas.
  const tar = (args: string[]) => execFileSync("tar", args, { encoding: "utf8", cwd: tmp });
  const lista = tar(["-tzf", tgz]).split(/\r?\n/).filter(Boolean);
  const manifesto = tar(["-xzOf", tgz, "package/package.json"]);
  const kb = Math.round(statSync(caminho).size / 1024);

  const proibidos = lista.filter((f) => PROIBIDOS.some((re) => re.test(f)));
  const workspace = /"workspace:/.test(manifesto);
  const lifecycle = /"(pre|post)install"\s*:/.test(manifesto);
  // O `pnpm audit` do workspace acusa 27 vulnerabilidades, TODAS na cadeia de dev (Expo,
  // Metro, PostCSS). Nenhuma alcanca quem instala, porque o que e publicado nao carrega
  // dependencia de terceiro nenhuma — e ISSO e o que vale travar. E uma afirmacao mais forte
  // que um nivel de severidade tolerado, e nao envelhece com o feed de avisos.
  const deps = Object.keys((JSON.parse(manifesto).dependencies ?? {}) as Record<string, string>);
  const terceiros = deps.filter((d) => !d.startsWith("@rojaostudio/"));

  console.log(`\n${pacote} — ${lista.length} arquivos · ${kb} KB (teto ${tetoKB})`);

  if (proibidos.length) {
    console.error(`  ✗ conteúdo proibido:`);
    for (const f of proibidos) console.error(`      ${f}`);
    falhas++;
  } else {
    console.log("  ✓ sem teste, sem private/, sem marca de cliente");
  }

  if (kb > tetoKB) {
    console.error(`  ✗ ${kb} KB acima do teto de ${tetoKB} KB`);
    falhas++;
  } else {
    console.log("  ✓ dentro do teto");
  }

  if (workspace) {
    console.error(`  ✗ "workspace:" no package.json empacotado — o tarball não instala`);
    falhas++;
  } else {
    console.log("  ✓ dependências resolvidas");
  }

  // Pacote sem script de ciclo de vida é o selo de confiança que 90% não tem: instalar não
  // executa código nosso. Se um postinstall aparecer um dia, que seja por decisão.
  if (lifecycle) {
    console.error(`  ✗ script de ciclo de vida (pre/postinstall) no pacote publicado`);
    falhas++;
  } else {
    console.log("  ✓ sem pre/postinstall");
  }

  if (terceiros.length) {
    console.error(`  ✗ dependência de terceiro em runtime: ${terceiros.join(", ")}`);
    falhas++;
  } else {
    console.log(`  ✓ sem dependência de terceiro em runtime${deps.length ? ` (só ${deps.join(", ")})` : ""}`);
  }

  rmSync(caminho);
}

rmSync(tmp, { recursive: true, force: true });

if (falhas) {
  console.error(`\n${falhas} falha(s) no gate do tarball.`);
  process.exit(1);
}
console.log("\nGate do tarball: ok.");
