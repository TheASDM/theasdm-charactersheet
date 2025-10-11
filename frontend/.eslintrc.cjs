module.exports = {
  root: true,
  env: { browser: true, es2021: true },
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
  plugins: ['eslint-plugin-local-rules', 'react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off', // Disabled for TS files
    'no-debugger': 'error',
    // React rules for automatic JSX runtime
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
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
