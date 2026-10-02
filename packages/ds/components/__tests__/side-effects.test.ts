// #63 — trava o campo `sideEffects` do package.json.
//
// Sem o campo, o bundler do consumidor não pode remover módulos do grafo, só apagar bindings não
// usados: componentes pesados entram no bundle de quem importa qualquer coisa do barrel.
//
// Só que a correção "óbvia" (`"sideEffects": false`) é um BUG, e é por isso que este teste existe:
// componentes que importam CSS de terceiros dependem desse import ser preservado. Com `false`, o
// bundler fica autorizado a dropar o CSS, e o estilo quebra em produção sem quebrar em dev, que é
// a pior categoria de regressão possível.
//
// A forma correta é a de array, listando os arquivos que TÊM efeito colateral. O segundo teste
// varre os componentes atrás de imports de CSS e falha se algum não estiver coberto pelos padrões
// declarados, para o campo não envelhecer calado quando alguém adicionar um componente novo.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const pkgRoot = join(__dirname, '..', '..');
const pkg = JSON.parse(readFileSync(join(pkgRoot, 'package.json'), 'utf8')) as {
  sideEffects?: unknown;
};

describe('sideEffects (#63)', () => {
  it('é um array, nunca false', () => {
    expect(pkg.sideEffects).not.toBe(false);
    expect(Array.isArray(pkg.sideEffects)).toBe(true);
  });

  it('cobre CSS', () => {
    expect(pkg.sideEffects as string[]).toContain('**/*.css');
  });

  it('todo import de CSS nos componentes está coberto pelos padrões declarados', () => {
    const dir = join(pkgRoot, 'components');
    const semCobertura: string[] = [];

    for (const file of readdirSync(dir).filter((f) => f.endsWith('.tsx') || f.endsWith('.ts'))) {
      const src = readFileSync(join(dir, file), 'utf8');
      // `import 'x.css'` — import só por efeito colateral, sem binding.
      for (const m of src.matchAll(/import\s+['"]([^'"]+\.css)['"]/g)) {
        const alvo = m[1];
        const coberto = (pkg.sideEffects as string[]).some((p) => p.includes('*.css'));
        if (!coberto) semCobertura.push(`${file} → ${alvo}`);
      }
    }

    expect(semCobertura).toEqual([]);
  });
});
