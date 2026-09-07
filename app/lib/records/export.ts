import type { Season } from '../../types';
import type { WatchlistItem } from '../storage/types';

function csvCell(value: unknown): string {
  const text = String(value ?? '');
  // 表計算ソフトで作品名やメモが式として実行されないようにする。
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function recordsToCsv(seasons: Season[], watchlist: WatchlistItem[]): string {
  const rows: unknown[][] = [
    ['種類', 'クール', '作品名', 'AniList ID', '評価', '状態', '観た話数', '全話数', 'メモ'],
  ];
  for (const season of seasons) {
    for (const anime of season.animes) {
      rows.push([
        '視聴記録',
        season.name,
        anime.title,
        anime.anilistId,
        anime.rating || '',
        anime.watched ? '視聴済み' : '未視聴',
        '',
        '',
        '',
      ]);
    }
  }
  for (const item of watchlist) {
    rows.push([
      '視聴予定',
      item.season_year && item.season ? `${item.season_year} ${item.season}` : '',
      item.title,
      item.anilist_id > 0 ? item.anilist_id : '',
      '',
      item.status,
      item.watched_episodes ?? 0,
      item.total_episodes,
      item.memo,
    ]);
  }
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function recordsToJson(
  seasons: Season[],
  watchlist: WatchlistItem[],
  now = new Date()
): string {
  return JSON.stringify(
    {
      format: 'animelog-records',
      version: 1,
      exportedAt: now.toISOString(),
      scope: '視聴記録と視聴予定。公開レビュー、プロフィール、推しキャラは含みません。',
      seasons,
      watchlist: watchlist.map((item) => {
        const record = { ...item };
        delete record.user_id;
        return record;
      }),
    },
    null,
    2
  );
}

export function downloadText(text: string, name: string, type: string): void {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
