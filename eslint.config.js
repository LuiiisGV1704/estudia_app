import ionic from '@ionic/eslint-config/recommended.js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default defineConfig([
  {
    ignores: [
      'dist/**',
      'android/**',
      'ios/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
    ],
  },
  ionic,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React components and providers rely on TypeScript's inferred return types.
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true, allowExportNames: ['useApp', 'useSession', 'useTheme'] },
      ],
    },
  },
]);
