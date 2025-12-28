'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

type PasswordStrength = {
  level: 'weak' | 'fair' | 'good' | 'strong';
  label: string;
  message: string;
  color: string;
  bars: number;
};

function getPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 6) {
    return {
      level: 'weak',
      label: '弱い',
      message: '6文字以上必要です',
      color: 'bg-red-500',
      bars: 1,
    };
  }
  
  if (password.length < 8) {
    return {
      level: 'fair',
      label: 'やや弱い',
      message: '8文字以上を推奨',
      color: 'bg-orange-500',
      bars: 2,
    };
  }
  
  const hasNumber = /\d/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  
  if (hasNumber && hasUpperCase) {
    return {
      level: 'strong',
      label: '強い',
      message: '強いパスワードです',
      color: 'bg-green-500',
      bars: 4,
    };
  }
  
  if (hasNumber) {
    return {
      level: 'good',
      label: '普通',
      message: '数字と大文字を含めるとより安全',
      color: 'bg-yellow-500',
      bars: 3,
    };
  }
  
  return {
    level: 'fair',
    label: 'やや弱い',
    message: '8文字以上を推奨',
    color: 'bg-orange-500',
    bars: 2,
  };
}

export function AuthModal({
  show,
  onClose,
  onAuthSuccess,
}: {
  show: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}) {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

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
        // 登録成功時、確認メール送信画面を表示
        setEmailSent(true);
        setAuthPassword('');
        // onAuthSuccess()は呼び出さない（まだ認証完了してないため）
      }
    } catch (error: any) {
      setAuthError(error.message || 'エラーが発生しました');
    }
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      // リセットメール送信成功時、確認画面を表示
      setResetEmailSent(true);
    } catch (error: any) {
      setAuthError(error.message || 'エラーが発生しました');
    }
  };

  const handleClose = () => {
    onClose();
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setEmailSent(false);
    setResetEmailSent(false);
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
          {authMode === 'login' ? 'ログイン' : authMode === 'signup' ? '新規登録' : 'パスワードをリセット'}
        </h2>

        {/* タブ切り替え */}
        {authMode !== 'reset' && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setAuthMode('login');
                setAuthError('');
                setEmailSent(false);
                setResetEmailSent(false);
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                authMode === 'login'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              ログイン
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setAuthError('');
                setEmailSent(false);
                setResetEmailSent(false);
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                authMode === 'signup'
                  ? 'bg-[#e879d4] text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              新規登録
            </button>
          </div>
        )}

        {/* エラーメッセージ */}
        {authError && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {authError}
          </div>
        )}

        {/* リセットメール送信後の画面 */}
        {resetEmailSent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="text-lg font-bold mb-2 dark:text-white">
              リセットメールを送信しました
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {authEmail} 宛てにパスワードリセット用のメールを送信しました。
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              メール内のリンクをクリックして、新しいパスワードを設定してください。
            </p>
            <button
              onClick={() => {
                setResetEmailSent(false);
                setAuthMode('login');
              }}
              className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
            >
              ログイン画面へ
            </button>
          </div>
        ) : emailSent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✉️</div>
            <h3 className="text-lg font-bold mb-2 dark:text-white">
              確認メールを送信しました
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {authEmail} 宛てに確認メールを送信しました。
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              メール内のリンクをクリックして、登録を完了してください。
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-6">
              ※ メールが届かない場合は、迷惑メールフォルダをご確認ください。
            </p>
            <button
              onClick={() => {
                setEmailSent(false);
                setAuthMode('login');
              }}
              className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
            >
              ログイン画面へ
            </button>
          </div>
        ) : authMode === 'reset' ? (
          <>
            {/* パスワードリセット画面 */}
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">🔑</div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                登録したメールアドレスを入力してください。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                パスワードリセット用のリンクをお送りします。
              </p>
            </div>

            {/* メールアドレス入力 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordReset();
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                placeholder="example@email.com"
              />
            </div>

            {/* 送信ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setResetEmailSent(false);
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={!authEmail}
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </>
        ) : (
          <>
            {/* メールアドレス入力 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                placeholder="example@email.com"
              />
            </div>

            {/* パスワード入力 */}
            <div className="mb-4">
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
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                placeholder="パスワードを入力"
              />
              {/* パスワード強度表示（新規登録時のみ） */}
              {authMode === 'signup' && authPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((bar) => {
                      const strength = getPasswordStrength(authPassword);
                      return (
                        <div
                          key={bar}
                          className={`h-1 flex-1 rounded ${
                            bar <= strength.bars
                              ? strength.color
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className={`text-xs ${
                    getPasswordStrength(authPassword).level === 'weak'
                      ? 'text-red-600 dark:text-red-400'
                      : getPasswordStrength(authPassword).level === 'fair'
                      ? 'text-orange-600 dark:text-orange-400'
                      : getPasswordStrength(authPassword).level === 'good'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {getPasswordStrength(authPassword).label} - {getPasswordStrength(authPassword).message}
                  </p>
                </div>
              )}
            </div>

            {/* パスワードを忘れた方リンク（ログイン画面のみ） */}
            {authMode === 'login' && (
              <div className="mb-6 text-right">
                <button
                  onClick={() => {
                    setAuthMode('reset');
                    setAuthError('');
                    setResetEmailSent(false);
                  }}
                  className="text-sm text-[#e879d4] hover:text-[#f09fe3] transition-colors"
                >
                  パスワードを忘れた方
                </button>
              </div>
            )}

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
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {authMode === 'login' ? 'ログイン' : '登録'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
