'use client';

import { forwardRef } from 'react';

export interface SeasonCardForExportProps {
  /** 例: "2026年夏 視聴予定"（呼び出し側で組み立てる） */
  seasonLabel: string;
  /** ログインしていれば「〇〇の」を前置。未ログインは null/undefined */
  userName?: string | null;
  /** 視聴予定の総数（covers は上限12でも、ここは全件数） */
  animeCount: number;
  /** 上限12件のカバー画像 */
  covers: { id: string; title: string; imageUrl: string | null }[];
}

// 画像URLをプロキシ経由に変換（DNACardForExport と同方式・CORS汚染回避）
const getProxiedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

/**
 * オフスクリーンで html2canvas に撮影させる用の「来期視聴予定カード」。
 * 1200×630（OGP標準）。絵文字を使わず文字＋図形のみ（html2canvasの豆腐回避）。
 * アカウント/プロフィールに依存せず、watchlist だけで描画できる（未ログインでも生成可）。
 */
const SeasonCardForExport = forwardRef<HTMLDivElement, SeasonCardForExportProps>(
  ({ seasonLabel, userName, animeCount, covers }, ref) => {
    const title = userName ? `${userName}の${seasonLabel}` : seasonLabel;
    const items = covers.slice(0, 12);

    const styles = {
      container: {
        width: 1200,
        height: 630,
        background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 55%, #f472b6 100%)',
        padding: 48,
        fontFamily: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif',
        display: 'flex',
        flexDirection: 'column' as const,
        position: 'relative' as const,
        overflow: 'hidden',
        boxSizing: 'border-box' as const,
      },
      header: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 28,
      },
      logo: {
        width: 52,
        height: 52,
        background: 'rgba(255, 255, 255, 0.25)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        color: '#ffffff',
        fontWeight: 'bold' as const,
        flexShrink: 0,
      },
      headerText: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
      },
      brand: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.85)',
        letterSpacing: 2,
      },
      title: {
        fontSize: 40,
        fontWeight: 'bold' as const,
        color: '#ffffff',
      },
      countBadge: {
        marginLeft: 'auto',
        padding: '10px 22px',
        background: 'rgba(255, 255, 255, 0.22)',
        borderRadius: 28,
        fontSize: 22,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        flexShrink: 0,
      },
      grid: {
        flex: 1,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gridAutoRows: '222px',
        gap: 14,
        alignContent: 'start' as const,
      },
      cover: {
        width: '100%',
        height: 222,
        borderRadius: 12,
        objectFit: 'cover' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '3px solid rgba(255, 255, 255, 0.25)',
      },
      coverPlaceholder: {
        width: '100%',
        height: 222,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        border: '3px solid rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        textAlign: 'center' as const,
        padding: 8,
        boxSizing: 'border-box' as const,
      },
      watermark: {
        position: 'absolute' as const,
        bottom: 22,
        right: 48,
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: 'rgba(255, 255, 255, 0.6)',
        letterSpacing: 1,
      },
    };

    return (
      <div ref={ref} style={styles.container}>
        <div style={styles.header}>
          <div style={styles.logo}>A</div>
          <div style={styles.headerText}>
            <span style={styles.brand}>アニメログ</span>
            <span style={styles.title}>{title}</span>
          </div>
          <div style={styles.countBadge}>全{animeCount}作品</div>
        </div>

        <div style={styles.grid}>
          {items.map((item, index) => {
            const proxiedUrl = getProxiedUrl(item.imageUrl);
            return proxiedUrl ? (
              <img
                key={item.id || index}
                src={proxiedUrl}
                alt={item.title}
                style={styles.cover}
                crossOrigin="anonymous"
              />
            ) : (
              <div key={item.id || index} style={styles.coverPlaceholder}>
                {item.title || 'No Image'}
              </div>
            );
          })}
        </div>

        <div style={styles.watermark}>animelog.jp</div>
      </div>
    );
  },
);

SeasonCardForExport.displayName = 'SeasonCardForExport';

export default SeasonCardForExport;
