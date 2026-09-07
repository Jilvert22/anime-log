'use client';
import { useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSession, signOut } from '../lib/api';
export function useAccountDeletion(user: User | null) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const deleteLock = useRef(false);
  const [deleteError, setDeleteError] = useState('');
  const handleDeleteAccount = async () => {
    if (deleteLock.current || !user) return;
    const expectedUserId = user.id;
    deleteLock.current = true;
    setDeleteError('');
    setDeleteLoading(true);

    try {
      // 認証トークンを取得
      const session = await getSession();
      if (!session || session.user.id !== expectedUserId) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ expectedUserId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの削除に失敗しました');
      }

      // 成功時は即座にリダイレクト（エラーハンドリングをスキップ）
      try {
        if ((await getSession())?.user.id === expectedUserId) await signOut();
      } catch {
        /* 削除は完了済み。ログアウト通信失敗で削除失敗と表示しない。 */
      }
      window.location.href = '/';
      return; // これ以降の処理を実行しない
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'アカウントの削除に失敗しました';
      setDeleteError(errorMessage);
      setDeleteLoading(false);
    } finally {
      deleteLock.current = false;
    }
  };

  return {
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteLoading,
    deleteError,
    setDeleteError,
    handleDeleteAccount,
  };
}
