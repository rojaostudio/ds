import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
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
          exclude: ['**/*.browser.test.tsx', '**/node_modules/**'],
        },
      },
      {
        // 2.0 (#13): components rendered in a real Chromium, with the [RDS] stylesheet and axe.
        // Contrast needs real layout and computed colour, which jsdom does not have.
        extends: true,
        test: {
          name: 'browser',
          include: ['components/**/*.browser.test.tsx'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
