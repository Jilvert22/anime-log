import type { NextConfig } from "next";
// @ts-ignore - next-pwa doesn't have type definitions
import withPWA from "next-pwa";
// @ts-ignore - @next/bundle-analyzer doesn't have type definitions
import bundleAnalyzer from "@next/bundle-analyzer";

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
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
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
    // 3. AniList API - NetworkFirst（短いタイムアウト）
    {
      urlPattern: /^https:\/\/graphql\.anilist\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'anilist-api',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1日
        },
        networkTimeoutSeconds: 5,
      },
    },
    // 4. Supabase API - NetworkOnly（認証・データ同期）
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkOnly',
    },
    // 5. Google Fonts - CacheFirst
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
    // 6. 静的アセット（JS/CSS/フォント）- StaleWhileRevalidate
    {
      urlPattern: /\.(?:js|css|woff2?)$/i,
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
      urlPattern: ({ url, sameOrigin }) => sameOrigin && !url.pathname.startsWith('/api/'),
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
