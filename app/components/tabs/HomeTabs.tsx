'use client';

import type { HomeSubTab } from '../../types';
import { HOME_TAB_GROUPS } from '../../lib/navigation';

export function HomeTabs({
  selected,
  onSelect,
}: {
  selected: HomeSubTab;
  onSelect: (tab: HomeSubTab) => void;
}) {
  return (
    <nav aria-label="アニメの表示切り替え" className="space-y-2 mb-5">
      {HOME_TAB_GROUPS.map((group) => (
        <div key={group.label} className="flex gap-2 items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 w-12 shrink-0">
            {group.label}
          </span>
          <div className="flex flex-wrap gap-2">
            {group.tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-tab={tab.id}
                aria-pressed={selected === tab.id}
                onClick={() => onSelect(tab.id)}
                className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${selected === tab.id ? 'bg-fuchsia-700 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
