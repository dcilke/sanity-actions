import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {FlatCompat} from '@eslint/eslintrc'
import js from '@eslint/js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  ...compat.config({
    env: {
      es2022: true,
      node: true,
    },
    extends: ['sanity', 'plugin:jest/recommended', 'prettier'],
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    plugins: ['jest'],
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
      'no-console': 'off',
      'prefer-const': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-arrow-callback': 'error',
      'prefer-template': 'error',
    },
    overrides: [
      {
        files: ['**/*.test.js', '**/*.spec.js'],
        env: {
          jest: true,
        },
      },
    ],
  }),
]
