'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export function AuthModal({
  show,
  onClose,
  onAuthSuccess,
}: {
  show: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}) {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuth = async () => {
    setAuthError('');
    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        onClose();
        setAuthEmail('');
        setAuthPassword('');
        onAuthSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        onClose();
        setAuthEmail('');
        setAuthPassword('');
        setAuthMode('login');
        onAuthSuccess();
      }
    } catch (error: any) {
      setAuthError(error.message || 'エラーが発生しました');
    }
  };

  const handleClose = () => {
    onClose();
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
  };

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 dark:text-white">
          {authMode === 'login' ? 'ログイン' : '新規登録'}
        </h2>

        {/* タブ切り替え */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setAuthMode('login');
              setAuthError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              authMode === 'login'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            ログイン
          </button>
          <button
            onClick={() => {
              setAuthMode('signup');
              setAuthError('');
            }}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
              authMode === 'signup'
                ? 'bg-[#ffc2d1] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            新規登録
          </button>
        </div>

        {/* エラーメッセージ */}
        {authError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {authError}
          </div>
        )}

        {/* メールアドレス入力 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="example@email.com"
          />
        </div>

        {/* パスワード入力 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            パスワード
          </label>
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAuth();
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ffc2d1] dark:bg-gray-700 dark:text-white"
            placeholder="パスワードを入力"
          />
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAuth}
            disabled={!authEmail || !authPassword}
            className="flex-1 bg-[#ffc2d1] text-white py-3 rounded-xl font-bold hover:bg-[#ffb07c] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {authMode === 'login' ? 'ログイン' : '登録'}
          </button>
        </div>
      </div>
    </div>
  );
}
