import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import lightoryPlugin from '../eslint-rules/lightory-rules.mjs';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'simple-import-sort': simpleImportSort,
      lightory: lightoryPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      // These react-hooks rules misfire on this project's imperative game-state patterns:
      // - immutability: singleton OfficeState/EditorState mutations are by design
      // - refs: containerRef reads during render feed canvas pipeline, not React state
      // - set-state-in-effect: timer-based animations and async error handling are legitimate
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'lightory/no-inline-colors': 'error',
      'lightory/pixel-shadow': 'error',
      'lightory/pixel-font': 'error',
    },
  },
  {
    files: ['src/constants.ts', 'src/fonts/**', 'src/office/sprites/**'],
    rules: {
      'lightory/no-inline-colors': 'off',
      'lightory/pixel-shadow': 'off',
      'lightory/pixel-font': 'off',
    },
  },
  eslintConfigPrettier,
]);
