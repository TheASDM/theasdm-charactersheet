module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['eslint-plugin-local-rules'],
  rules: {
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off', // Disabled for TS files
    'no-debugger': 'error',
    // Custom D&D template parsing enforcement rule
    'local-rules/require-dnd-template-parsing': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-unused-vars': 'off', // Let TypeScript handle this
      }
    }
  ]
}
