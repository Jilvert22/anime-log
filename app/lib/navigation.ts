import type { HomeSubTab } from '../types';

export const HOME_TAB_GROUPS: { label: string; tabs: { id: HomeSubTab; label: string }[] }[] = [
  {
    label: '見る',
    tabs: [
      { id: 'watching', label: '視聴中' },
      { id: 'watchlist', label: '積みアニメ' },
      { id: 'current-season', label: '来期視聴予定' },
    ],
  },
  {
    label: '振り返る',
    tabs: [
      { id: 'seasons', label: 'クール別' },
      { id: 'series', label: 'シリーズ' },
      { id: 'gallery', label: 'ギャラリー' },
    ],
  },
];

export function parseTab(value: string | null): HomeSubTab | 'mypage' {
  if (value === 'mypage') return value;
  return (
    HOME_TAB_GROUPS.flatMap((group) => group.tabs).find((tab) => tab.id === value)?.id ?? 'seasons'
  );
}
