// @ts-nocheck
// eslint.config.mjs
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import unusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

export default [
  // 🔒 IGNORAR TODO LO GENERADO (antes de cualquier otra config)
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',        // ← clave
      '.next',              // ← por si acaso en Windows paths
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/*.min.js',
      '**/*.bundle.js',
      '**/*.map'
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        fetch: 'readonly'
      }
    },
    rules: { 'no-undef': 'off' }
  },

  // Base JS
  js.configs.recommended,

  // Reglas comunes
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    settings: { react: { version: 'detect' } },
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'unused-imports': unusedImports
    },
    rules: {
      '@next/next/no-html-link-for-pages': 'warn',
      '@next/next/no-sync-scripts': 'error',
      '@next/next/no-document-import-in-page': 'error',
      '@next/next/no-img-element': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'unused-imports/no-unused-imports': 'warn',
      'unused-imports/no-unused-vars': [
        'warn',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },

  // JS puro (sin typed linting)
  {
    files: ['**/*.{js,jsx}'],
    rules: { 'no-console': 'off' }
  },

  // TS/TSX (type-aware)
 {
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    parser: tsParser,
    parserOptions: { project: './tsconfig.eslint.json' }
  },
  plugins: { '@typescript-eslint': tsPlugin },
  rules: {
    // 🔴 apaga la base y usa solo la de TS:
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ],
    '@typescript-eslint/consistent-type-imports': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    // por falsos positivos
    'no-control-regex': 'off',
    // por si algún preset volvió a encenderlo:
    'no-undef': 'off'
  }
},

  // Declaraciones
  {
    files: ['**/*.d.ts'],
    rules: {
      'no-undef': 'off',
      'no-redeclare': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
];
