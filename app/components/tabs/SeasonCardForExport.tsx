'use client';

import { forwardRef } from 'react';
import { formatStartDate } from '../../utils/animeDate';

export interface SeasonCoverItem {
  id: string;
  title: string;
  imageUrl: string | null;
  isContinuing?: boolean;
  status?: 'planned' | 'watching' | 'completed';
  startDate?: { year: number | null; month: number | null; day?: number | null } | null;
}

export interface SeasonCardForExportProps {
  /** 例: "2026年秋 視聴予定"（呼び出し側で組み立てる） */
  seasonLabel: string;
  /** ログインしていれば「〇〇の」を前置。未ログインは null/undefined */
  userName?: string | null;
  /** 視聴予定の総数（covers は上限16でも、ここは全件数） */
  animeCount: number;
  /** 上限は内部で丸める。overflow時は最後のセルに「+N」を表示 */
  covers: SeasonCoverItem[];
}

// 画像URLをプロキシ経由に変換（外部URL のみ、内部パスはそのまま）
const getProxiedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('/')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
};

const MAX_COVERS = 12;

// 作品数に応じたグリッドレイアウト。少作品時は列数を減らして余白を減らす。
function getGridLayout(n: number): { cols: number; rows: number } {
  if (n <= 1) return { cols: 1, rows: 1 };
  if (n <= 2) return { cols: 2, rows: 1 };
  if (n <= 3) return { cols: 3, rows: 1 };
  if (n <= 4) return { cols: 2, rows: 2 };
  if (n <= 6) return { cols: 3, rows: 2 };
  if (n <= 9) return { cols: 3, rows: 3 };
  return { cols: 4, rows: 3 }; // 10-12
}

/**
 * オフスクリーンで html2canvas に撮影させる用の「シーズン視聴予定カード」。
 * 1200×630（OGP標準）。動的グリッドで作品数に応じて列数調整。
 * 継続中タグ・視聴中タグ・放送開始日を各カバーに重畳。
 */
const SeasonCardForExport = forwardRef<HTMLDivElement, SeasonCardForExportProps>(
  ({ seasonLabel, userName, animeCount, covers }, ref) => {
    const title = userName ? `${userName}の${seasonLabel}` : seasonLabel;

    // 上限を超えた場合は最後のセルを「+N」表示に置き換える
    const overflow = covers.length > MAX_COVERS;
    const shownCovers = overflow ? covers.slice(0, MAX_COVERS - 1) : covers.slice(0, MAX_COVERS);
    const remaining = overflow ? covers.length - shownCovers.length : 0;

    // グリッド計算 (overflow 表示の +1 セル分も含める)
    const cellCount = shownCovers.length + (overflow ? 1 : 0);
    const { cols, rows } = getGridLayout(cellCount);

    // セルサイズを 2:3 のポスター aspect に固定して計算。
    // 利用可能領域 (padding 96 + header ~90 + watermark ~30 を差し引いた実効エリア) の
    // width/height 両制約から min を取って、セル最大サイズを求める。
    const POSTER_W_OVER_H = 2 / 3;
    const gap = 14;
    const availableWidth = 1104; // 1200 - padding 96
    const availableHeight = 400; // ヘッダー・ウォーターマーク・余白ぶんを引いた実効
    const cellHeightFromRows = (availableHeight - gap * (rows - 1)) / rows;
    const cellWidthFromCols = (availableWidth - gap * (cols - 1)) / cols;
    const cellHeight = Math.floor(
      Math.min(cellHeightFromRows, cellWidthFromCols / POSTER_W_OVER_H)
    );
    const rowHeight = cellHeight; // 縦方向のセル高さ (バッジ配置計算で参照)
    const cellWidth = Math.floor(cellHeight * POSTER_W_OVER_H);

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
        marginBottom: 24,
      },
      logo: {
        width: 56,
        height: 56,
        borderRadius: 12,
        objectFit: 'cover' as const,
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
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
        fontSize: 36,
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
      gridWrapper: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      },
      grid: {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
        gridAutoRows: `${cellHeight}px`,
        gap: `${gap}px`,
        // ポスター aspect 保持のため、grid 自体は固定サイズ。中央寄せは gridWrapper 側で
        justifyContent: 'center' as const,
        alignContent: 'center' as const,
      },
      coverWrap: {
        position: 'relative' as const,
        width: cellWidth,
        height: cellHeight,
        borderRadius: 12,
        overflow: 'hidden' as const,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
      },
      cover: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        display: 'block',
      },
      coverPlaceholder: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 13,
        textAlign: 'center' as const,
        padding: 8,
        boxSizing: 'border-box' as const,
      },
      badgeContinuing: {
        position: 'absolute' as const,
        top: 6,
        left: 6,
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        backgroundColor: 'rgb(147, 51, 234)', // purple-600
        borderRadius: 4,
        letterSpacing: 1,
      },
      badgeWatching: {
        position: 'absolute' as const,
        top: 6,
        left: 6,
        padding: '3px 8px',
        fontSize: 11,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        backgroundColor: 'rgb(234, 179, 8)', // yellow-500
        borderRadius: 4,
        letterSpacing: 1,
      },
      startDate: {
        position: 'absolute' as const,
        bottom: 6,
        left: 6,
        padding: '2px 6px',
        fontSize: 11,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        borderRadius: 4,
      },
      overflowBadge: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        fontSize: rows >= 3 ? 28 : 44,
        fontWeight: 'bold' as const,
        color: '#ffffff',
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderRadius: 12,
      },
      watermark: {
        position: 'absolute' as const,
        bottom: 22,
        right: 48,
        fontSize: 18,
        fontWeight: 'bold' as const,
        color: 'rgba(255, 255, 255, 0.7)',
        letterSpacing: 1,
      },
    };

    return (
      <div ref={ref} style={styles.container}>
        <div style={styles.header}>
          <img src="/icon-192.png" alt="アニメログ" style={styles.logo} crossOrigin="anonymous" />
          <div style={styles.headerText}>
            <span style={styles.brand}>アニメログ</span>
            <span style={styles.title}>{title}</span>
          </div>
          <div style={styles.countBadge}>全{animeCount}作品</div>
        </div>

        <div style={styles.gridWrapper}>
          <div style={styles.grid}>
            {shownCovers.map((item, index) => {
              const proxiedUrl = getProxiedUrl(item.imageUrl);
              const startDateText = formatStartDate(item.startDate);
              return (
                <div key={item.id || index} style={styles.coverWrap}>
                  {proxiedUrl ? (
                    <img
                      src={proxiedUrl}
                      alt={item.title}
                      style={styles.cover}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div style={styles.coverPlaceholder}>{item.title || 'No Image'}</div>
                  )}
                  {item.isContinuing && <span style={styles.badgeContinuing}>継続中</span>}
                  {!item.isContinuing && item.status === 'watching' && (
                    <span style={styles.badgeWatching}>視聴中</span>
                  )}
                  {startDateText && <span style={styles.startDate}>{startDateText}</span>}
                </div>
              );
            })}
            {overflow && (
              <div style={styles.coverWrap}>
                <div style={styles.overflowBadge}>+{remaining}</div>
              </div>
            )}
          </div>
        </div>

        <div style={styles.watermark}>animelog.jp</div>
      </div>
    );
  }
);

SeasonCardForExport.displayName = 'SeasonCardForExport';

export default SeasonCardForExport;
