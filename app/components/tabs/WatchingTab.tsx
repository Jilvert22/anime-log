'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getStorageService } from '../../lib/storage';
import { useAuth } from '../../hooks/useAuth';
import type { WatchlistItem } from '../../lib/storage/types';
import type { HomeSubTab } from '../../types';
import { ErrorState } from '../common/ErrorState';
import { EpisodeProgressCard } from './watching/EpisodeProgressCard';

export default function WatchingTab({ onNavigate }: { onNavigate: (tab: HomeSubTab) => void }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <p role="status">読み込み中…</p>;
  return <WatchingList key={user?.id ?? 'guest'} loggedIn={!!user} onNavigate={onNavigate} />;
}

function WatchingList({
  loggedIn,
  onNavigate,
}: {
  loggedIn: boolean;
  onNavigate: (tab: HomeSubTab) => void;
}) {
  const storage = useMemo(() => getStorageService(loggedIn), [loggedIn]);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [includePlanned, setIncludePlanned] = useState(false);
  const cycle = useRef(Symbol());
  const load = useCallback(async () => {
    const request = Symbol();
    cycle.current = request;
    setLoading(true);
    setError(false);
    try {
      const rows = await storage.getWatchlist();
      if (request === cycle.current) setItems(rows);
    } catch {
      if (request === cycle.current) setError(true);
    } finally {
      if (request === cycle.current) setLoading(false);
    }
  }, [storage]);
  useEffect(() => {
    void load();
    return () => {
      cycle.current = Symbol();
    };
  }, [load]);

  const visible = items.filter((item) =>
    includePlanned ? item.status !== 'completed' : item.status === 'watching'
  );
  const unavailable = loggedIn && items.some((item) => item.watched_episodes === undefined);
  return (
    <section className="space-y-4">
      <div className="flex justify-between gap-3 items-center">
        <div>
          <h2 className="text-xl font-bold dark:text-white">今日の視聴を記録</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            クールや積みアニメの区分をまたいで、観ている作品をまとめます。
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="shrink-0 text-sm py-3 text-fuchsia-800 dark:text-fuchsia-300"
        >
          再読み込み
        </button>
      </div>
      <label className="flex gap-2 items-center text-sm dark:text-gray-200">
        <input
          type="checkbox"
          checked={includePlanned}
          onChange={(event) => setIncludePlanned(event.target.checked)}
        />
        これから観る作品も表示
      </label>
      {unavailable && (
        <p role="status" className="text-sm text-gray-600 dark:text-gray-300">
          アカウントへの話数保存は準備中です。作品の確認と、従来のステータス変更は利用できます。
        </p>
      )}
      {loading ? (
        <p role="status">読み込み中…</p>
      ) : error ? (
        <ErrorState message="視聴中の作品を読み込めませんでした" onRetry={load} />
      ) : (
        <>
          {visible.length === 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
              <p>
                {items.length
                  ? '表示する作品がありません。「これから観る作品も表示」から、観始める作品を選べます。'
                  : 'まず観たい作品を追加しましょう。'}
              </p>
              <button
                type="button"
                onClick={() => onNavigate('watchlist')}
                className="mt-3 px-4 py-3 bg-fuchsia-700 text-white rounded-xl"
              >
                積みアニメから選ぶ
              </button>
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {visible.map((item) => (
              <EpisodeProgressCard
                key={item.id}
                item={item}
                enabled={!loggedIn || item.watched_episodes !== undefined}
                onDetail={() =>
                  onNavigate(item.season_year && item.season ? 'current-season' : 'watchlist')
                }
                onSave={async (progress) => {
                  const updated = await storage.saveWatchlistProgress(item.id, progress, {
                    watched_episodes: item.watched_episodes ?? 0,
                    total_episodes: item.total_episodes ?? null,
                  });
                  setItems((current) =>
                    current.map((row) => (row.id === updated.id ? updated : row))
                  );
                }}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
