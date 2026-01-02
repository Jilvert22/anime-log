'use client';

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { getSession, signOut, updateEmail, updatePassword } from '../../../lib/api';
import { useAuth } from '../../../hooks/useAuth';
import { usePWAInstall } from '../../../hooks/usePWAInstall';
import { track } from '@vercel/analytics/react';

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

interface SettingsSectionProps {
  onOpenSettingsModal: () => void;
  handleLogout: () => void;
}

export default function SettingsSection({ onOpenSettingsModal, handleLogout }: SettingsSectionProps) {
  const { user } = useAuth();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [showPWAInstallModal, setShowPWAInstallModal] = useState(false);
  
  // メールアドレス変更用のstate
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  
  // パスワード変更用のstate
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // 共通のstate
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState('');
  
  // 重複削除用のstate
  const [showRemoveDuplicatesConfirm, setShowRemoveDuplicatesConfirm] = useState(false);
  const [removeDuplicatesLoading, setRemoveDuplicatesLoading] = useState(false);
  const [removeDuplicatesError, setRemoveDuplicatesError] = useState('');
  const [removeDuplicatesSuccess, setRemoveDuplicatesSuccess] = useState('');

  const handleDeleteAccount = async () => {
    setDeleteError('');
    setDeleteLoading(true);

    try {
      // 認証トークンを取得
      const session = await getSession();
      if (!session) {
        throw new Error('認証が必要です');
      }

      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウントの削除に失敗しました');
      }

      // 成功時は即座にリダイレクト（エラーハンドリングをスキップ）
      await signOut();
      window.location.href = '/';
      return; // これ以降の処理を実行しない
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'アカウントの削除に失敗しました';
      setDeleteError(errorMessage);
      setDeleteLoading(false);
    }
  };

  const handleEmailChange = async () => {
    setChangeError('');
    setChangeSuccess('');
    setChangeLoading(true);

    try {
      if (!newEmail || !newEmail.includes('@')) {
        throw new Error('有効なメールアドレスを入力してください');
      }

      await updateEmail(newEmail);

      setChangeSuccess('確認メールを送信しました');
      setNewEmail('');
      
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        setShowEmailChange(false);
        setChangeSuccess('');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'メールアドレスの変更に失敗しました';
      setChangeError(errorMessage);
    } finally {
      setChangeLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setChangeError('');
    setChangeSuccess('');
    setChangeLoading(true);

    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('パスワードは6文字以上で入力してください');
      }

      if (newPassword !== confirmNewPassword) {
        throw new Error('新しいパスワードが一致しません');
      }

      await updatePassword(newPassword);

      setChangeSuccess('パスワードを変更しました');
      setNewPassword('');
      setConfirmNewPassword('');
      setCurrentPassword('');
      
      // 3秒後にモーダルを閉じる
      setTimeout(() => {
        setShowPasswordChange(false);
        setChangeSuccess('');
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'パスワードの変更に失敗しました';
      setChangeError(errorMessage);
    } finally {
      setChangeLoading(false);
    }
  };

  const handleRemoveDuplicates = async () => {
    setRemoveDuplicatesError('');
    setRemoveDuplicatesSuccess('');
    setRemoveDuplicatesLoading(true);

    try {
      const response = await fetch('/api/remove-duplicate-animes', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '重複アニメの削除に失敗しました');
      }

      setRemoveDuplicatesSuccess(data.message || `${data.deletedCount}件の重複アニメを削除しました`);
      
      // 3秒後にモーダルを閉じてページをリロード
      setTimeout(() => {
        setShowRemoveDuplicatesConfirm(false);
        setRemoveDuplicatesSuccess('');
        window.location.reload();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '重複アニメの削除に失敗しました';
      setRemoveDuplicatesError(errorMessage);
    } finally {
      setRemoveDuplicatesLoading(false);
    }
  };

  const handlePWAInstall = async () => {
    // 設定画面からのインストールクリックイベントを送信
    track('pwa_install_settings_clicked', { platform: isIOS ? 'ios' : 'android' });
    if (isIOS) {
      setShowPWAInstallModal(true);
    } else {
      const success = await install();
      if (success) {
        setShowPWAInstallModal(false);
      }
    }
  };

  return (
    <>
      <section className="space-y-2">
        <h2 className="text-xl font-bold px-4 text-[#6b5b6e] dark:text-white font-mixed">⚙️ 設定</h2>
        
        {/* PWAインストール（未インストール時のみ表示） */}
        {!isInstalled && (isInstallable || isIOS) && (
          <div className="px-4">
            <div className="bg-gradient-to-r from-[#e879d4] to-[#f09fe3] rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
              <button
                onClick={handlePWAInstall}
                className="w-full px-4 py-4 flex items-center justify-between hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div className="text-left">
                    <div className="text-white font-bold text-base">アプリをインストール</div>
                    <div className="text-white/90 text-sm">ホーム画面に追加でより快適に</div>
                  </div>
                </div>
                <span className="text-white text-xl">→</span>
              </button>
            </div>
          </div>
        )}
        
        {/* アカウント設定（折りたたみ可能） */}
        <div className="px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
            {/* ヘッダー */}
            <button
              onClick={() => setIsAccountSettingsOpen(!isAccountSettingsOpen)}
              className="w-full px-4 py-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            >
              <span className="text-gray-700 dark:text-gray-200 font-medium">アカウント設定</span>
              <span className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                isAccountSettingsOpen ? '' : 'rotate-[-90deg]'
              }`}>
                ▼
              </span>
            </button>
            
            {/* 折りたたみコンテンツ */}
            <div
              className={`overflow-hidden transition-all duration-200 ${
                isAccountSettingsOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={onOpenSettingsModal}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-200 font-mixed border-b border-gray-200 dark:border-gray-700"
                >
                  プロフィール編集
                </button>
                <button 
                  onClick={() => {
                    setShowEmailChange(true);
                    setNewEmail('');
                    setChangeError('');
                    setChangeSuccess('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-200 font-mixed border-b border-gray-200 dark:border-gray-700"
                >
                  メールアドレスを変更
                </button>
                <button 
                  onClick={() => {
                    setShowPasswordChange(true);
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setCurrentPassword('');
                    setChangeError('');
                    setChangeSuccess('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-gray-700 dark:text-gray-200 font-mixed border-b border-gray-200 dark:border-gray-700"
                >
                  パスワードを変更
                </button>
                <button 
                  onClick={() => {
                    setShowRemoveDuplicatesConfirm(true);
                    setRemoveDuplicatesError('');
                    setRemoveDuplicatesSuccess('');
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-orange-600 dark:text-orange-400 font-mixed"
                >
                  重複アニメを削除
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ご意見・ご感想 */}
        <div className="px-4 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLScfwMPJs8-qazTa9kfnDU6b4gqRLJVleDJkDgeCFDeuJjlxUQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors block text-gray-700 dark:text-gray-200 font-mixed"
            >
              ご意見・ご感想
            </a>
          </div>
        </div>

        {/* ログアウト・アカウント削除 */}
        <div className="px-4 mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-md">
            <button 
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-pink-500 dark:text-pink-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors font-mixed border-b border-gray-200 dark:border-gray-700"
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
        </div>
      </section>

      {/* メールアドレス変更モーダル */}
      {showEmailChange && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!changeLoading) {
              setShowEmailChange(false);
              setChangeError('');
              setChangeSuccess('');
              setNewEmail('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">✉️</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                メールアドレスを変更
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                現在: {user?.email || '未設定'}
              </p>
            </div>

            {/* 入力欄 */}
            <div className="mb-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="新しいメールアドレス"
                disabled={changeLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              ※ 確認メールが送信されます。メール内のリンクをクリックして変更を完了してください。
            </p>

            {/* 成功メッセージ */}
            {changeSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {changeSuccess}
              </div>
            )}

            {/* エラーメッセージ */}
            {changeError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {changeError}
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailChange(false);
                  setChangeError('');
                  setChangeSuccess('');
                  setNewEmail('');
                }}
                disabled={changeLoading}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleEmailChange}
                disabled={changeLoading}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {changeLoading ? '送信中...' : '変更する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* パスワード変更モーダル */}
      {showPasswordChange && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!changeLoading) {
              setShowPasswordChange(false);
              setChangeError('');
              setChangeSuccess('');
              setNewPassword('');
              setConfirmNewPassword('');
              setCurrentPassword('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">🔑</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                パスワードを変更
              </h2>
            </div>

            {/* 入力欄 */}
            <div className="mb-4 space-y-3">
              <div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード"
                  disabled={changeLoading}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {/* パスワード強度表示 */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((bar) => {
                        const strength = getPasswordStrength(newPassword);
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
                      getPasswordStrength(newPassword).level === 'weak'
                        ? 'text-red-600 dark:text-red-400'
                        : getPasswordStrength(newPassword).level === 'fair'
                        ? 'text-orange-600 dark:text-orange-400'
                        : getPasswordStrength(newPassword).level === 'good'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {getPasswordStrength(newPassword).label} - {getPasswordStrength(newPassword).message}
                    </p>
                  </div>
                )}
              </div>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="新しいパスワード（確認）"
                disabled={changeLoading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* 成功メッセージ */}
            {changeSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {changeSuccess}
              </div>
            )}

            {/* エラーメッセージ */}
            {changeError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {changeError}
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordChange(false);
                  setChangeError('');
                  setChangeSuccess('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setCurrentPassword('');
                }}
                disabled={changeLoading}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handlePasswordChange}
                disabled={changeLoading}
                className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {changeLoading ? '変更中...' : '変更する'}
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 重複削除確認モーダル */}
      {showRemoveDuplicatesConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            if (!removeDuplicatesLoading) {
              setShowRemoveDuplicatesConfirm(false);
              setRemoveDuplicatesError('');
              setRemoveDuplicatesSuccess('');
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                重複アニメを削除
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                同じタイトルのアニメが複数ある場合、最も古いものを残して残りを削除します。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                この操作は取り消せません。
              </p>
            </div>

            {/* 成功メッセージ */}
            {removeDuplicatesSuccess && (
              <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                {removeDuplicatesSuccess}
              </div>
            )}

            {/* エラーメッセージ */}
            {removeDuplicatesError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {removeDuplicatesError}
              </div>
            )}

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemoveDuplicatesConfirm(false);
                  setRemoveDuplicatesError('');
                  setRemoveDuplicatesSuccess('');
                }}
                disabled={removeDuplicatesLoading}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                キャンセル
              </button>
              <button
                onClick={handleRemoveDuplicates}
                disabled={removeDuplicatesLoading}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:bg-orange-400 disabled:cursor-not-allowed"
              >
                {removeDuplicatesLoading ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWAインストール案内モーダル（iOS用） */}
      {showPWAInstallModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPWAInstallModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-xl font-bold mb-2 dark:text-white">
                ホーム画面に追加
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                iOSの場合、以下の手順でアプリをインストールできます：
              </p>
            </div>

            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#e879d4] text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Safariの下部にある<strong>共有ボタン（□↑）</strong>をタップ
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#e879d4] text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>「ホーム画面に追加」</strong>を選択
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-[#e879d4] text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>「追加」</strong>をタップ
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPWAInstallModal(false)}
              className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}

