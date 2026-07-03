import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Claude Code のworktree (リポジトリの完全コピーを含む)
    '.claude/**',
    // next-pwa が生成する Service Worker
    'public/sw.js',
    'public/workbox-*.js',
    'public/fallback-*.js',
    // テスト成果物
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
  ]),
  // Node.js ビルドスクリプトは CommonJS (require) を許可
  {
    files: ['scripts/**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // React Compiler 系ルールの既存違反 (2026-07時点で15件) は「触るときに直す」方針。
  // error だと CI が通らないため warn に降格し、--max-warnings ラチェットで増加のみ防ぐ。
  // 新規コードでこの警告を増やさないこと。
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  // 逆流防止ガード: components/ と hooks/ から animes テーブルを直接クエリするのを禁止。
  // DB アクセスは必ず app/lib/api/animes.ts のリポジトリ関数を経由すること
  // (エラー処理・DB制約違反の集約点を1つに保つため)。
  {
    files: ['app/components/**/*.{ts,tsx}', 'app/hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.property.name='from'] > Literal[value='animes']",
          message:
            'components/hooks から animes テーブルを直接クエリしないでください。app/lib/api/animes.ts のリポジトリ関数 (getAnimesByUser/insertAnime/updateAnimeFields 等) を使ってください。',
        },
      ],
    },
  },
]);

export default eslintConfig;
