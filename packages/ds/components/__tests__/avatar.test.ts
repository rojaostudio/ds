import { describe, it, expect } from 'vitest';
import { initials } from '../avatar';

describe('initials()', () => {
  it('nome único usa as duas primeiras letras', () => {
    expect(initials('Marco')).toBe('MA');
  });

  it('nome composto retorna primeira e última inicial', () => {
    expect(initials('Marcos Silva')).toBe('MS');
  });

  it('nome composto com 3 partes usa primeira e última', () => {
    expect(initials('Ana Paula Costa')).toBe('AC');
  });

  it('string vazia retorna ?', () => {
    expect(initials('')).toBe('?');
  });

  it('espaços extras são ignorados', () => {
    expect(initials('  João   Souza  ')).toBe('JS');
  });

  it('sempre retorna uppercase', () => {
    expect(initials('ana silva')).toBe('AS');
  });
});
