import type { NextConfig } from 'next';
// @ts-expect-error - next-pwa doesn't have type definitions
import withPWA from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's4.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 's3.anilist.co',
      },
      {
        protocol: 'https',
        hostname: 'cdn.anilist.co',
      },
    ],
    // 画像最適化の強化
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30日
    dangerouslyAllowSVG: false,
  },
  // コンパイラ最適化
  compiler: {
    // 本番環境でのconsole.logを削除
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },
  // 実験的な機能（パフォーマンス改善）
  experimental: {
    // 最適化されたパッケージインポート
    optimizePackageImports: ['lucide-react', '@supabase/supabase-js'],
  },
  // クライアント側に環境変数を公開
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 開発環境では無効化
  // フォント(woff2)を install 時プリキャッシュから除外する。
  // next/font の M PLUS Rounded サブセットは 500ファイル超あり、全ページで
  // 使うわけではないのに SW install 時に一括ダウンロードされて帯域と
  // キャッシュを浪費していた。オンライン中に一度要求された woff2 は下記
  // runtimeCaching #5(CacheFirst・専用 fonts 枠)が遅延キャッシュするため再訪時は
  // 利用できるが、未取得分はオフラインでは system font にフォールバックする。
  buildExcludes: [/\.woff2$/],
  // オフライン時、キャッシュ未ヒットのページ遷移に自前の /offline を返す
  //（ブラウザ標準のエラー画面の代わり）。next-pwa 5.6 は App Router の
  // app/offline/page.tsx を自動検出しないため fallbacks で明示する。
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    // 1. AniList画像 - CacheFirst（30日キャッシュ）
    {
      urlPattern: /^https:\/\/s[34]\.anilist\.co\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'anilist-images',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 2. AniList CDN画像 - CacheFirst
    {
      urlPattern: /^https:\/\/cdn\.anilist\.co\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'anilist-images',
        expiration: {
          maxEntries: 500,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 3. Supabase API - NetworkOnly（認証・データ同期）
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkOnly',
      // fallbacks 有効時、next-pwa は全ルールに handlerDidError を注入する際
      // c.options を参照するため、options 無しだとビルドが落ちる。
      // document 以外（API fetch）には /offline を返さないので挙動は不変。
      options: {},
    },
    // 4. Google Fonts - CacheFirst
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年
        },
      },
    },
    // 5. フォント（woff2）- CacheFirst（専用枠）
    // next/font のサブセットはハッシュ付きURL＝内容不変。JS/CSS(#6)と cache を
    // 分けることで、多数の woff2 サブセットが JS/CSS 枠を LRU 退避させる/される
    // 相互干渉を防ぐ。runtime で一度取得したフォントは長期(1年)保持する。
    {
      urlPattern: /\.woff2?$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1年（内容不変のため長期）
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // 6. 静的アセット（JS/CSS）- StaleWhileRevalidate
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7日
        },
      },
    },
    // 7. 同一オリジンのページ - NetworkFirst
    {
      urlPattern: ({ url, sameOrigin }: { url: URL; sameOrigin: boolean }) =>
        sameOrigin && !url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
        networkTimeoutSeconds: 5,
      },
    },
    // 8. フォールバック（その他）- NetworkFirst
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fallback-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
        networkTimeoutSeconds: 10,
        fetchOptions: {
          credentials: 'include',
        },
      },
    },
  ],
});

// bundle-analyzerとPWAの両方を適用
export default withBundleAnalyzer(pwaConfig(nextConfig));
