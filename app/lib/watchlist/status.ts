// 視聴ステータスの単一定義（型・巡回遷移・表示ラベル・バッジ色・選択肢）。
// 値importを持たない末端モジュールとして保つことで、storage/api の型定義から
// `import type` で参照しても循環参照が発生しないようにしている。

export const WATCHLIST_STATUSES = ['planned', 'watching', 'completed'] as const;

export type WatchlistStatus = (typeof WATCHLIST_STATUSES)[number];

// 保存値としては未設定（null）を取りうる
export type WatchlistStatusValue = WatchlistStatus | null;

// フィルタUI用（全件を表す 'all' を含む）
export type WatchlistStatusFilter = WatchlistStatus | 'all';

// ステータスの巡回遷移（planned→watching→completed→null、未設定はwatchingへ）
export function getNextWatchlistStatus(
  current: WatchlistStatusValue | undefined
): WatchlistStatusValue {
  switch (current) {
    case 'planned':
      return 'watching';
    case 'watching':
      return 'completed';
    case 'completed':
      return null; // 完了後は削除またはそのまま
    default:
      return 'watching'; // statusがnullの場合はwatchingに
  }
}

// 日本語ラベル（E2E・UI表示で参照される文字列。変更厳禁）
export function getWatchlistStatusLabel(
  status: WatchlistStatusValue | undefined
): string {
  switch (status) {
    case 'planned':
      return '視聴予定';
    case 'watching':
      return '視聴中';
    case 'completed':
      return '視聴完了';
    default:
      return '未設定';
  }
}

// バッジ背景色（Tailwindの完全なクラス文字列。動的組み立てはしない）
export function getWatchlistStatusColor(
  status: WatchlistStatusValue | undefined
): string {
  switch (status) {
    case 'planned':
      return 'bg-blue-500';
    case 'watching':
      return 'bg-yellow-500';
    case 'completed':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

// ステータス選択肢（表示順: 視聴予定→視聴中→視聴完了）
export const WATCHLIST_STATUS_OPTIONS: {
  status: WatchlistStatus;
  label: string;
  color: string;
}[] = WATCHLIST_STATUSES.map((status) => ({
  status,
  label: getWatchlistStatusLabel(status),
  color: getWatchlistStatusColor(status),
}));
