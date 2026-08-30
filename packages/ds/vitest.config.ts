import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: [
      'components/**/*.test.ts',
      'components/**/*.test.tsx',
      'targets/**/*.test.ts',
      'generate/**/*.test.ts',
      'themes/**/*.test.ts',
      'scripts/**/*.test.ts',
      // A pasta `private/` nao existe no repositorio publico (#101). O glob nao casar com
      // nada la e silencioso e correto — aqui ele cobre as marcas que sairam do pacote.
      'private/**/*.test.ts',
    ],
  },
});
