'use client';

import { useRef, useState } from 'react';
import type { WatchlistItem } from '../../../lib/storage/types';
import type { WatchlistProgress } from '../../../lib/api/types';
import { MAX_EPISODES, nextProgress, validateProgress } from '../../../lib/watchlist/progress';
import { useFeedback } from '../../../contexts/FeedbackContext';

export function EpisodeProgressCard({
  item,
  enabled,
  onSave,
  onDetail,
}: {
  item: WatchlistItem;
  enabled: boolean;
  onSave: (progress: WatchlistProgress) => Promise<void>;
  onDetail: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [watched, setWatched] = useState('');
  const [total, setTotal] = useState('');
  const { showToast } = useFeedback();
  const progress = {
    watched_episodes: item.watched_episodes ?? 0,
    total_episodes: item.total_episodes ?? null,
  };
  const finished =
    progress.total_episodes !== null && progress.watched_episodes >= progress.total_episodes;

  async function save(getProgress: () => WatchlistProgress) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const value = getProgress();
      validateProgress(value);
      await onSave(value);
      setEditing(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '話数を保存できませんでした', 'error');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
      <button
        type="button"
        onClick={onDetail}
        className="text-left font-bold text-gray-900 dark:text-white underline-offset-4 hover:underline"
      >
        {item.title}
      </button>
      <div className="flex items-center justify-between gap-3">
        <p aria-live="polite" className="text-gray-700 dark:text-gray-200">
          <strong className="text-2xl">{progress.watched_episodes}</strong>
          {progress.total_episodes === null ? ' 話まで視聴' : ` / ${progress.total_episodes} 話`}
        </p>
        <button
          type="button"
          disabled={!enabled || busy || finished || progress.watched_episodes >= MAX_EPISODES}
          onClick={() => void save(() => nextProgress(progress))}
          aria-label={`${item.title}を1話観た`}
          className="rounded-xl bg-fuchsia-700 text-white px-4 py-3 font-bold disabled:opacity-40"
        >
          {busy ? '保存中…' : '＋1話'}
        </button>
      </div>
      {finished && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          全話視聴しました。作品の詳細から「視聴完了」にできます。
        </p>
      )}
      {enabled && (
        <button
          type="button"
          disabled={busy}
          className="text-sm text-fuchsia-800 dark:text-fuchsia-300 py-2"
          onClick={() => {
            setWatched(String(progress.watched_episodes));
            setTotal(progress.total_episodes === null ? '' : String(progress.total_episodes));
            setEditing(!editing);
          }}
        >
          {editing ? '編集を閉じる' : '話数を編集'}
        </button>
      )}
      {editing && (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save(() => {
              if (watched.trim() === '') throw new Error('観た話数を入力してください');
              return {
                watched_episodes: Number(watched),
                total_episodes: total.trim() === '' ? null : Number(total),
              };
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-700 dark:text-gray-200">
              観た話数
              <input
                type="number"
                required
                min={0}
                max={MAX_EPISODES}
                step={1}
                value={watched}
                onChange={(event) => setWatched(event.target.value)}
                className="mt-1 w-full border rounded-lg p-2 dark:bg-gray-900"
              />
            </label>
            <label className="text-sm text-gray-700 dark:text-gray-200">
              全話数（任意）
              <input
                type="number"
                min={1}
                max={MAX_EPISODES}
                step={1}
                value={total}
                onChange={(event) => setTotal(event.target.value)}
                placeholder="未定"
                className="mt-1 w-full border rounded-lg p-2 dark:bg-gray-900"
              />
            </label>
          </div>
          <button
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-fuchsia-700 text-white disabled:opacity-40"
          >
            保存する
          </button>
        </form>
      )}
    </article>
  );
}
