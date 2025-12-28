'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

interface SettingsSectionProps {
  onOpenSettingsModal: () => void;
  handleLogout: () => void;
}

export default function SettingsSection({ onOpenSettingsModal, handleLogout }: SettingsSectionProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの削除に失敗しました');
      }

      // 成功時は即座にリダイレクト（エラーハンドリングをスキップ）
      await supabase.auth.signOut();
      window.location.href = '/';
      return; // これ以降の処理を実行しない
    } catch (error: any) {
      setDeleteError(error.message || 'アカウントの削除に失敗しました');
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <section className="space-y-2">
        <h2 className="text-xl font-bold px-4 text-[#6b5b6e] dark:text-white font-mixed">⚙️ 設定</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-700 shadow-md">
          <button 
            onClick={onOpenSettingsModal}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-[#6b5b6e] dark:text-white font-mixed"
          >
            プロフィール編集
          </button>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLScfwMPJs8-qazTa9kfnDU6b4gqRLJVleDJkDgeCFDeuJjlxUQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors block text-[#6b5b6e] dark:text-white font-mixed"
          >
            ご意見・ご感想
          </a>
          <button 
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-mixed"
          >
            ログアウト
          </button>
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full px-4 py-3 text-left text-red-500 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-mixed"
          >
            アカウント削除
          </button>
        </div>
      </section>

      {/* 削除確認モーダル */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!deleteLoading) {
              setShowDeleteConfirm(false);
              setDeleteError('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                アカウントを削除しますか？
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                この操作は取り消せません。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                以下のデータがすべて削除されます：
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 text-left list-disc list-inside mb-4 space-y-1">
                <li>プロフィール情報</li>
                <li>視聴履歴・評価</li>
                <li>感想・レビュー</li>
                <li>コレクション（推しキャラ、名言など）</li>
              </ul>
            </div>

            {/* エラーメッセージ */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {deleteError}
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
              >
                {deleteLoading ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

