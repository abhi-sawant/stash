import js from '@eslint/js';
// Import the Prettier config last to disable conflicting rules
import prettierConfig from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  // 1. Ignore files
  globalIgnores(['dist']),

  // 2. Base Configuration for TypeScript and React
  {
    files: ['**/*.{ts,tsx}'],
    // Setup React environment and standard JS/TS rules
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],

    // ESLint-Plugin-React setup for Flat Config
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },

    settings: {
      react: {
        version: 'detect', // Auto-detect React version
      },
    },

    rules: {
      // General Rules
      'no-console': 'warn',
      // React Rules (Optional but good practice)
      'react-refresh/only-export-components': 'off',
      'react/react-in-jsx-scope': 'off', // Not needed for React 17+ (New JSX Transform)
      'react/self-closing-comp': 'error',
      'react/jsx-no-useless-fragment': 'warn',
      // Accessibility Rules
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',

      // TypeScript specific rules (Adjust as needed)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // 3. Prettier Integration (MUST be last)
  // This disables all ESLint rules that might conflict with Prettier.
  prettierConfig,
]);
