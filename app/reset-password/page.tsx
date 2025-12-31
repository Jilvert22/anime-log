'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { updatePassword } from '../lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setError('');
    
    // バリデーション
    if (!password || !confirmPassword) {
      setError('パスワードを入力してください');
      return;
    }
    
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }
    
    setLoading(true);
    
    try {
      await updatePassword(password);
      setSuccess(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'パスワードの更新に失敗しました';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fef6f0] dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-lg">
        {success ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-4 dark:text-white">
              パスワードを更新しました
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              新しいパスワードでログインできます。
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
            >
              ログインページへ
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🔐</div>
              <h1 className="text-2xl font-bold mb-2 dark:text-white">
                新しいパスワードを設定
              </h1>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 新しいパスワード入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                新しいパスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePassword();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                placeholder="新しいパスワードを入力"
              />
            </div>

            {/* パスワード確認入力 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                パスワード確認
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePassword();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                placeholder="パスワードを再入力"
              />
            </div>

            {/* 送信ボタン */}
            <button
              onClick={handleUpdatePassword}
              disabled={loading || !password || !confirmPassword}
              className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? '処理中...' : 'パスワードを更新'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

