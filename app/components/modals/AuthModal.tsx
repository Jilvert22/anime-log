'use client';

import { useState } from 'react';
import { getSupabaseEnv } from '../../lib/env';
import { supabase } from '../../lib/supabase';
import { signInWithPassword, signUp, resetPasswordForEmail } from '../../lib/api';
import { TermsPrivacyModal } from './TermsPrivacyModal';

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
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // localStorageからSupabaseへのマイグレーション
  const migrateLocalStorageToSupabase = async () => {
    try {
      setIsMigrating(true);
      const { getLocalStorageService } = await import('../../lib/storage');
      const { getSupabaseStorageService } = await import('../../lib/storage');
      
      const localStorageService = getLocalStorageService();
      const supabaseService = getSupabaseStorageService();
      
      // localStorageから全データを取得
      const items = localStorageService.getAllWatchlistItems();
      
      if (items.length > 0) {
        // Supabaseに移行
        const success = await supabaseService.migrateToSupabase(items);
        
        if (success) {
          // 移行成功後、localStorageをクリア
          localStorageService.clearWatchlist();
          console.log(`Migrated ${items.length} items from localStorage to Supabase`);
        } else {
          console.error('Migration failed');
        }
      }
    } catch (error) {
      console.error('Migration error:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleAuth = async () => {
    setAuthError('');
    try {
      // 環境変数のチェック（クライアント側）
      let supabaseUrl: string;
      let supabaseAnonKey: string;
      try {
        const env = getSupabaseEnv(true);
        supabaseUrl = env.url;
        supabaseAnonKey = env.anonKey;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Supabaseの設定が正しくありません';
        setAuthError(`${errorMessage}。管理者にお問い合わせください。`);
        console.error('Supabase環境変数が不足しています:', error);
        return;
      }

      if (authMode === 'login') {
        await signInWithPassword(authEmail, authPassword);
        
        // ログイン成功後、マイグレーションを実行
        await migrateLocalStorageToSupabase();
        
        onClose();
        setAuthEmail('');
        setAuthPassword('');
        onAuthSuccess();
      } else {
        // 新規登録時は利用規約への同意を確認
        if (!agreedToTerms) {
          setAuthError('利用規約とプライバシーポリシーへの同意が必要です');
          return;
        }
        
        try {
          const result = await signUp(authEmail, authPassword);
          
          // 登録成功時、確認メール送信画面を表示
          setEmailSent(true);
          setAuthPassword('');
          setAgreedToTerms(false);
          // onAuthSuccess()は呼び出さない（まだ認証完了してないため）
        } catch (error) {
          // エラーメッセージに「既に登録されています」が含まれているかチェック
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('既に登録されています') || 
              errorMessage.includes('already registered') ||
              errorMessage.includes('User already registered')) {
            setAuthError('このメールアドレスは既に登録されています。ログインタブからログインしてください。');
            setAuthPassword('');
            setAgreedToTerms(false);
            // ログインタブに切り替える
            setAuthMode('login');
          } else {
            // その他のエラーはそのまま表示
            throw error;
          }
        }
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      // より詳細なエラーメッセージを表示
      if (error instanceof Error) {
        // 新APIのエラーメッセージは既に日本語化されている
        setAuthError(error.message || 'エラーが発生しました。しばらく待ってから再度お試しください。');
      } else {
        setAuthError('エラーが発生しました。しばらく待ってから再度お試しください。');
      }
    }
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    try {
      await resetPasswordForEmail(authEmail);
      // リセットメール送信成功時、確認画面を表示
      setResetEmailSent(true);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setAuthError(error.message || 'エラーが発生しました');
      } else {
        setAuthError('エラーが発生しました');
      }
    }
  };

  const handleClose = () => {
    onClose();
    setAuthError('');
    setAuthEmail('');
    setAuthPassword('');
    setShowPassword(false);
    setEmailSent(false);
    setResetEmailSent(false);
    setAgreedToTerms(false);
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
                setAgreedToTerms(false);
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAuth();
                    }
                  }}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                  placeholder="パスワードを入力"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
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

            {/* 利用規約への同意チェックボックス（新規登録時のみ） */}
            {authMode === 'signup' && (
              <div className="mb-4">
                <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#e879d4] border-gray-300 rounded focus:ring-[#e879d4] focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowTermsModal(true);
                      }}
                      className="text-[#e879d4] hover:text-[#f09fe3] underline"
                    >
                      利用規約
                    </button>
                    と
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowPrivacyModal(true);
                      }}
                      className="text-[#e879d4] hover:text-[#f09fe3] underline"
                    >
                      プライバシーポリシー
                    </button>
                    に同意する
                  </span>
                </label>
              </div>
            )}

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
                disabled={!authEmail || !authPassword || (authMode === 'signup' && !agreedToTerms) || isMigrating}
                className="flex-1 bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isMigrating ? 'データ移行中...' : (authMode === 'login' ? 'ログイン' : '登録')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 利用規約モーダル */}
      <TermsPrivacyModal
        show={showTermsModal}
        type="terms"
        onClose={() => setShowTermsModal(false)}
      />

      {/* プライバシーポリシーモーダル */}
      <TermsPrivacyModal
        show={showPrivacyModal}
        type="privacy"
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}
