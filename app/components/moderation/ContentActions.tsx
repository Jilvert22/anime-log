'use client';

import { useRef, useState, useId, useEffect } from 'react';
import Link from 'next/link';
import { useModeration } from '../../contexts/ModerationContext';
import { useFeedback } from '../../contexts/FeedbackContext';
import { reportContent } from '../../lib/api/moderation';
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '../../lib/moderation/types';

export function ContentActions({
  userId,
  userName,
  reviewId,
  onBlocked,
}: {
  userId: string;
  userName: string;
  reviewId?: string;
  onBlocked?: () => void;
}) {
  const { user, isLoading, ready, error, block } = useModeration();
  const { showToast, confirmDialog } = useFeedback();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  if (isLoading || user?.id === userId) return null;
  if (!user)
    return (
      <Link href="/?tab=mypage" className="text-xs underline text-gray-600 dark:text-gray-300">
        通報・ブロックにはログインが必要です
      </Link>
    );
  async function handleBlock() {
    if (lock.current) return;
    lock.current = true;
    try {
      if (
        !(await confirmDialog({
          message: `${userName}さんをブロックしますか？ログイン中はお互いのプロフィール・投稿を表示せず、フォローも解除します。解除はマイページからできます。`,
          danger: true,
          confirmLabel: 'ブロックする',
        }))
      )
        return;
      setBusy(true);
      await block(userId);
      onBlocked?.();
      showToast('ブロックしました');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ブロックに失敗しました', 'error');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="mt-3">
      <details>
        <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-300 py-2">
          通報・ブロック
        </summary>
        <div className="flex flex-wrap gap-2 text-sm">
          {reviewId && (
            <button
              type="button"
              onClick={() => setTarget({ type: 'review', id: reviewId })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
            >
              この感想を通報
            </button>
          )}
          {!reviewId && (
            <button
              type="button"
              onClick={() => setTarget({ type: 'user', id: userId })}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
            >
              ユーザーを通報
            </button>
          )}
          <button
            type="button"
            disabled={busy || !ready || error}
            onClick={() => void handleBlock()}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-red-700 dark:text-red-300 disabled:opacity-40"
          >
            ブロックする
          </button>
        </div>
        {error && (
          <p className="text-xs text-amber-800 dark:text-amber-300">
            ブロック情報を取得できません。マイページから再読み込みしてください。
          </p>
        )}
      </details>
      {target && (
        <ReportDialog
          key={`${target.type}:${target.id}`}
          target={target}
          ownerId={user.id}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

function ReportDialog({
  target,
  ownerId,
  onClose,
}: {
  target: ReportTarget;
  ownerId: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const { showToast } = useFeedback();
  const [reason, setReason] = useState<ReportReason>('harassment');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (!lock.current) onClose();
      }
      if (event.key === 'Tab') {
        const items = formRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),select,textarea'
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', keydown, true);
    return () => window.removeEventListener('keydown', keydown, true);
  }, [onClose]);
  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await reportContent(target, reason, details, ownerId);
      showToast('通報を受け付けました。運営が内容を確認します。');
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : '通報を保存できませんでした');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <form
        ref={formRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-5 space-y-4 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-bold dark:text-white">
          {target.type === 'review' ? '感想を通報' : 'ユーザーを通報'}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          通報は運営が確認します。送信者の情報を相手へ通知しません。見たくない場合はブロックも利用できます。
        </p>
        <label className="block text-sm dark:text-white">
          理由
          <select
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value as ReportReason)}
            className="mt-1 w-full border border-gray-300 rounded-lg p-3 dark:bg-gray-900"
          >
            {REPORT_REASONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm dark:text-white">
          補足（任意・1000文字以内）
          <textarea
            value={details}
            maxLength={1000}
            onChange={(event) => setDetails(event.target.value)}
            className="mt-1 w-full min-h-28 border border-gray-300 rounded-lg p-3 dark:bg-gray-900"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-300 p-3 dark:text-white"
          >
            キャンセル
          </button>
          <button
            disabled={busy}
            className="flex-1 rounded-xl bg-fuchsia-700 text-white p-3 disabled:opacity-40"
          >
            {busy ? '送信中…' : '通報を送信'}
          </button>
        </div>
      </form>
    </div>
  );
}
