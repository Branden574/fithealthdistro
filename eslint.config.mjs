import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    'out/**',
    'next-env.d.ts',
    // The design system is type-checked by its own build (strict tsc); its generated files are never linted.
    'design-system/**',
    'supabase/.temp/**',
  ]),
]);
