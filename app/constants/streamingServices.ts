export const STREAMING_SERVICE_STYLES: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  'dアニメストア': {
    bg: 'bg-pink-100',
    text: 'text-pink-700',
    darkBg: 'dark:bg-pink-900/30',
    darkText: 'dark:text-pink-300',
  },
  'Amazon Prime Video': {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    darkBg: 'dark:bg-sky-900/30',
    darkText: 'dark:text-sky-300',
  },
  'Netflix': {
    bg: 'bg-red-100',
    text: 'text-red-700',
    darkBg: 'dark:bg-red-900/30',
    darkText: 'dark:text-red-300',
  },
  'U-NEXT': {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    darkBg: 'dark:bg-emerald-900/30',
    darkText: 'dark:text-emerald-300',
  },
  'ABEMA': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    darkBg: 'dark:bg-green-900/30',
    darkText: 'dark:text-green-300',
  },
  'Disney+': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    darkBg: 'dark:bg-indigo-900/30',
    darkText: 'dark:text-indigo-300',
  },
  'Hulu': {
    bg: 'bg-lime-100',
    text: 'text-lime-700',
    darkBg: 'dark:bg-lime-900/30',
    darkText: 'dark:text-lime-300',
  },
  'FOD': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    darkBg: 'dark:bg-orange-900/30',
    darkText: 'dark:text-orange-300',
  },
  'DMM TV': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    darkBg: 'dark:bg-purple-900/30',
    darkText: 'dark:text-purple-300',
  },
  'バンダイチャンネル': {
    bg: 'bg-rose-100',
    text: 'text-rose-700',
    darkBg: 'dark:bg-rose-900/30',
    darkText: 'dark:text-rose-300',
  },
  'ニコニコ動画': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-300',
  },
  'ニコニコチャンネル': {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    darkBg: 'dark:bg-gray-700',
    darkText: 'dark:text-gray-300',
  },
  'TVer': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    darkBg: 'dark:bg-cyan-900/30',
    darkText: 'dark:text-cyan-300',
  },
  'Lemino': {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-900/30',
    darkText: 'dark:text-yellow-300',
  },
};

// デフォルトスタイル（リストにないサービス用）
export const DEFAULT_STREAMING_STYLE = {
  bg: 'bg-blue-100',
  text: 'text-blue-700',
  darkBg: 'dark:bg-blue-900/30',
  darkText: 'dark:text-blue-300',
};

// スタイル取得ヘルパー
export function getStreamingServiceStyle(serviceName: string) {
  return STREAMING_SERVICE_STYLES[serviceName] || DEFAULT_STREAMING_STYLE;
}

