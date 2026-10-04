// P0 do "Sua cor" (showroom): o tema de UMA cor, gerado por generateRdsTheme e emitido por emitRdsCss, medido
// nos tokens de COMPONENTE (styles/rds/components.css), não só nos papéis do tema. Cada par texto/fundo dos
// componentes é resolvido até a cor final, com alpha composto sobre o que está embaixo, nos modos light, dark e
// plate. Falha abaixo de 4.5:1 (texto) e 3:1 (borda, ícone, logo). Os pares e o resolvedor: rds-component-contrast.ts.
import { describe, expect, it } from 'vitest';
import { generateRdsTheme, type BrandDef } from '@rojaostudio/ds-core/generate';
import { failures, PAIRS, unknownTokens } from './rds-component-contrast';

// As cores que quebravam: amarelo, verde, vermelho, roxo, cinza, ciano claro, quase preto, quase branco, laranja.
const HARD = ['#FFD60A', '#10B981', '#E11D48', '#7C3AED', '#6B7280', '#22D3EE', '#111111', '#F5F5F5', '#FF6A00'];

// Como o showroom monta a receita de uma cor (ds-www, lib/rds-theme.ts, colorDef).
const one = (hex: string): BrandDef =>
  ({ name: 'brand', brand: { primary: hex }, surface: 'neutral', text: 'neutral', fonts: { body: 'inter' } }) as BrandDef;

describe('[RDS] contraste dos componentes no tema de uma cor', () => {
  it('todo token citado nos pares existe em components.css', () => {
    expect(PAIRS.length).toBeGreaterThan(300);
    expect(unknownTokens()).toEqual([]);
  });

  it.each(HARD)('%s: todo par texto/fundo dos componentes passa em light, dark e plate', (hex) => {
    const bad = failures(generateRdsTheme(one(hex), { warn: () => {} })).map(
      (f) => `${f.mode} ${f.fg} sobre ${f.bg}: ${f.ratio}:1 (${f.colours}, mínimo ${f.kind === 't' ? 4.5 : 3})`,
    );
    expect(bad).toEqual([]);
  });
});
