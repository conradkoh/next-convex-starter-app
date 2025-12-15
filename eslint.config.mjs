import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import convexPlugin from '@convex-dev/eslint-plugin';

/**
 * ESLint Configuration
 *
 * This configuration migrates rules from biome.json to ESLint.
 * It includes TypeScript, React, and Convex-specific rules.
 *
 * Rule Mapping from Biome:
 * - noUnusedVariables -> @typescript-eslint/no-unused-vars
 * - noUnusedImports -> @typescript-eslint/no-unused-vars (with ignoreRestSiblings)
 * - noExplicitAny -> @typescript-eslint/no-explicit-any
 * - noParameterAssign -> no-param-reassign
 * - useAsConstAssertion -> @typescript-eslint/prefer-as-const
 * - useDefaultParameterLast -> @typescript-eslint/default-param-last
 * - useSelfClosingElements -> react/self-closing-comp
 * - useSingleVarDeclarator -> one-var
 * - noInferrableTypes -> @typescript-eslint/no-inferrable-types
 * - noUselessElse -> no-else-return
 * - useConsistentArrayType -> @typescript-eslint/array-type
 */

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.nx/**',
      '**/dist/**',
      '**/build/**',
      '**/.convex/**',
      '**/.git/**',
      '**/convex/_generated/**',
    ],
  },

  // Base TypeScript configuration for all files
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      '@convex-dev': convexPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // ============================================
      // Migrated from Biome: correctness rules
      // ============================================

      // noUnusedVariables: error -> @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // ============================================
      // Migrated from Biome: suspicious rules
      // ============================================

      // noExplicitAny: warn
      '@typescript-eslint/no-explicit-any': 'warn',

      // ============================================
      // Migrated from Biome: style rules
      // ============================================

      // noParameterAssign: error
      'no-param-reassign': 'error',

      // useAsConstAssertion: error
      '@typescript-eslint/prefer-as-const': 'error',

      // useDefaultParameterLast: error
      '@typescript-eslint/default-param-last': 'error',

      // useSelfClosingElements: error
      'react/self-closing-comp': [
        'error',
        {
          component: true,
          html: true,
        },
      ],

      // useSingleVarDeclarator: error
      'one-var': ['error', 'never'],

      // noInferrableTypes: error
      '@typescript-eslint/no-inferrable-types': 'error',

      // noUselessElse: error
      'no-else-return': ['error', { allowElseIf: false }],

      // useConsistentArrayType: error (shorthand syntax like string[] instead of Array<string>)
      '@typescript-eslint/array-type': ['error', { default: 'array' }],

      // ============================================
      // React Hooks rules
      // ============================================
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ============================================
      // Convex-specific rules
      // ============================================
      '@convex-dev/explicit-table-ids': 'error',

      // ============================================
      // Additional recommended rules
      // ============================================
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },

  // JavaScript files - disable TypeScript-specific rules
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      '@typescript-eslint/default-param-last': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/array-type': 'off',
    },
  },

  // Test files - relaxed rules
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/test/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // Configuration files
  {
    files: ['*.config.{js,ts,mjs,cjs}', 'postcss.config.mjs'],
    rules: {
      'no-console': 'off',
    },
  },

  // Script files - console.log is expected
  {
    files: ['**/scripts/**/*.{js,ts}', 'scripts/**/*.{js,ts}'],
    rules: {
      'no-console': 'off',
    },
  },
];

