import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Pragmatic: the codebase intentionally uses `any` in a few DOM/test spots.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
