'use client';

import { useRef, useState } from 'react';
import { useModeration } from '../../contexts/ModerationContext';
import { useFeedback } from '../../contexts/FeedbackContext';

export function BlockedUsersSection() {
  const { user, entries, ready, error, reload, unblock } = useModeration();
  const { showToast, confirmDialog } = useFeedback();
  const [busy, setBusy] = useState<string | null>(null);
  const lock = useRef(false);
  if (!user) return null;
  async function remove(id: string, name: string) {
    if (lock.current) return;
    lock.current = true;
    try {
      if (
        !(await confirmDialog({
          message: `${name}さんのブロックを解除しますか？フォロー関係は自動では戻りません。`,
          confirmLabel: '解除する',
        }))
      )
        return;
      setBusy(id);
      await unblock(id);
      showToast('ブロックを解除しました');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '解除に失敗しました', 'error');
    } finally {
      lock.current = false;
      setBusy(null);
    }
  }
  return (
    <section
      aria-label="ブロック管理"
      className="rounded-2xl bg-white dark:bg-gray-800 p-5 space-y-3"
    >
      <h2 className="font-bold text-lg dark:text-white">ブロックしたユーザー</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        ログイン中のお互いの表示とフォローを制限します。ログアウトした人による公開ページの閲覧を防ぐ機能ではありません。
      </p>
      {!ready ? (
        <p role="status">読み込み中…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-amber-800 dark:text-amber-300">
          一覧を取得できませんでした。
        </p>
      ) : entries.length ? (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.blocked_id}
              className="flex gap-3 items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-3"
            >
              <span className="break-words text-sm dark:text-white">{entry.blocked_label}</span>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void remove(entry.blocked_id, entry.blocked_label)}
                className="shrink-0 px-3 py-2 text-sm underline text-fuchsia-800 dark:text-fuchsia-300 disabled:opacity-40"
              >
                解除
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">ブロック中のユーザーはいません。</p>
      )}
      <button
        type="button"
        onClick={reload}
        className="text-sm underline text-fuchsia-800 dark:text-fuchsia-300 py-2"
      >
        一覧を再読み込み
      </button>
    </section>
  );
}
