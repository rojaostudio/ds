import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The published bin (dist/cli.js, built by tsup), the way `npx @rojaostudio/ds-codemod` runs it.
const PKG = join(__dirname, '..', '..');
const BIN = join(PKG, 'dist', 'cli.js');

describe('the bin', () => {
  it('package.json points rojao-ds-codemod at dist/cli.js, with ts-morph as its only dependency', () => {
    const pkg = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'));
    expect(pkg.bin).toEqual({ 'rojao-ds-codemod': './dist/cli.js' });
    expect(Object.keys(pkg.dependencies)).toEqual(['ts-morph']);
  });

  it.skipIf(!existsSync(BIN))('runs from dist with a shebang and prints the usage', () => {
    expect(readFileSync(BIN, 'utf8').startsWith('#!/usr/bin/env node')).toBe(true);
    const out = execFileSync(process.execPath, [BIN, '--help'], { encoding: 'utf8' });
    expect(out).toContain('npx @rojaostudio/ds-codemod <pasta-do-projeto>');
  });
});
