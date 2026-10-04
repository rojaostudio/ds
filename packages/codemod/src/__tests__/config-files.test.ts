import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cleanNextConfig, cleanNpmrc } from '../config-files';

const DIR = join(__dirname, '..', '__fixtures__', 'config');
const read = (name: string) => readFileSync(join(DIR, name), 'utf8');

describe('.npmrc: only the DS scope leaves GitHub Packages', () => {
  it('a file with only the DS registry and the token is left empty (the CLI removes it)', () => {
    const r = cleanNpmrc(read('npmrc-only-ds.input'))!;
    expect(r.output).toBe('');
    expect(r.removed).toHaveLength(2);
    expect(r.tokenKeptFor).toEqual([]);
  });

  it('keeps every other setting', () => {
    const r = cleanNpmrc(read('npmrc-mixed.input'))!;
    expect(r.output).toBe(read('npmrc-mixed.output'));
    expect(r.removed.map((l) => l.split('=')[0])).toEqual(['@rojao:registry', '//npm.pkg.github.com/:_authToken']);
  });

  it('keeps the token while another scope still points at GitHub Packages, and says which', () => {
    const r = cleanNpmrc(read('npmrc-other-scope.input'))!;
    expect(r.output).toBe(read('npmrc-other-scope.output'));
    expect(r.removed).toEqual(['@rojaostudio:registry=https://npm.pkg.github.com']);
    expect(r.tokenKeptFor).toEqual(['@acme:registry=https://npm.pkg.github.com']);
  });

  it('does not touch a file without the DS registry, token included', () => {
    expect(cleanNpmrc(read('npmrc-no-ds.input'))).toBeUndefined();
  });

  it('keeps CRLF line endings', () => {
    const crlf = (s: string) => s.replace(/\n/g, '\r\n');
    expect(cleanNpmrc(crlf(read('npmrc-mixed.input')))!.output).toBe(crlf(read('npmrc-mixed.output')));
  });

  it('is idempotent: the output has nothing left to change', () => {
    for (const name of ['npmrc-mixed', 'npmrc-other-scope']) expect(cleanNpmrc(read(`${name}.output`))).toBeUndefined();
  });
});

describe('next.config: only the DS leaves transpilePackages', () => {
  it.each([
    ['next-config-only-ds', '.ts', true],
    ['next-config-mixed', '.mjs', false],
    ['next-config-multiline', '.js', false],
    ['next-config-inline', '.mjs', true],
  ])('%s', (name, ext, removedKey) => {
    const r = cleanNextConfig(read(`${name}.input${ext}`), `next.config${ext}`);
    expect(r).toMatchObject({ kind: 'changed', removedKey });
    if (r.kind !== 'changed') return;
    expect(r.output).toBe(read(`${name}.output${ext}`));
    // Idempotent.
    expect(cleanNextConfig(r.output, `next.config${ext}`)).toEqual({ kind: 'none' });
  });

  it('removes only the DS entries, whatever the quotes', () => {
    const r = cleanNextConfig(read('next-config-mixed.input.mjs'), 'next.config.mjs');
    expect(r.kind === 'changed' && r.removed).toEqual(["'@rojaostudio/ds'", "'@rojao/ds'"]);
  });

  it.each([
    ['next-config-variable.input.ts', 'variável'],
    ['next-config-spread.input.mjs', 'spread'],
    ['next-config-assignment.input.js', 'fora do objeto'],
  ])('%s: a shape it cannot read whole is manual', (name, reason) => {
    const r = cleanNextConfig(read(name), name.replace(/^.*\.input/, 'next.config'));
    expect(r.kind).toBe('manual');
    expect(r.kind === 'manual' && r.reason).toContain(reason);
  });

  it('leaves alone a transpilePackages without the DS', () => {
    expect(cleanNextConfig(read('next-config-other.input.ts'), 'next.config.ts')).toEqual({ kind: 'none' });
  });

  it('keeps CRLF line endings when the key goes', () => {
    const crlf = (s: string) => s.replace(/\n/g, '\r\n');
    const r = cleanNextConfig(crlf(read('next-config-only-ds.input.ts')), 'next.config.ts');
    expect(r.kind === 'changed' && r.output).toBe(crlf(read('next-config-only-ds.output.ts')));
  });
});
