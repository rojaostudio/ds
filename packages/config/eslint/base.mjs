import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import next from '@next/eslint-plugin-next';

// Config flat compartilhada (rojao-ds#66). Deliberadamente CURTA: o valor de um lint num repo
// que nunca teve nenhum está em pegar erro de verdade — hook fora de ordem, variável morta,
// import esquecido — não em brigar por estilo. Formatação é do Prettier.
export default [
  { ignores: ['**/node_modules/**', '**/.next/**', '**/.turbo/**', '**/dist/**'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, '@next/next': next },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // `_` como prefixo é intenção explícita de descartar — não é código morto.
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'none', // `catch {}` vazio é padrão do repo pra best-effort
      }],

      // `any` aparece nas fronteiras (jsonb do banco, DOM serializado). Avisa, não trava.
      '@typescript-eslint/no-explicit-any': 'warn',

      // 'all': só cobra const quando TODAS as vars do destructuring podem ser const. Sem isso,
      // `let [side, cross] = …` com só `side` sendo reatribuído viraria erro insolúvel.
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },

  // O plugin do Next entra só pra que as regras `@next/next/*` EXISTAM — o repo tem
  // `eslint-disable-next-line @next/next/no-img-element` espalhado nos componentes, e uma
  // diretiva que aponta pra regra inexistente é erro. As regras em si não são ativadas aqui:
  // o pacote DS não é um app Next, e quem monta <img> sabe o que está fazendo.

  // Artefatos JS gerados pelo build (preset do NativeWind) — CommonJS rodando em Node.
  {
    files: ['**/targets/native/preset.js', '**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { module: 'writable', require: 'readonly', __dirname: 'readonly' },
    },
  },

  // Scripts de build rodam em Node e usam console de propósito.
  {
    files: ['**/scripts/**/*.ts', '**/*.config.{ts,js,mjs}'],
    rules: { 'no-console': 'off' },
  },
];
