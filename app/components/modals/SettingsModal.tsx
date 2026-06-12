'use client';

import { useState, useEffect } from 'react';
import { X, UserRound } from 'lucide-react';
import type { UserProfile } from '../../lib/api';
import type { User } from '../../types';

// オタクタイプのプリセット定義
const OTAKU_TYPES = [
  { id: 'analyst', icon: '🔍', label: '考察厨' },
  { id: 'emotional', icon: '😭', label: '感情移入型' },
  { id: 'visual', icon: '🎨', label: '作画厨' },
  { id: 'audio', icon: '🎵', label: '音響派' },
  { id: 'character', icon: '💕', label: 'キャラオタ' },
  { id: 'passionate', icon: '🔥', label: '熱血派' },
  { id: 'story', icon: '🎬', label: 'ストーリー重視' },
  { id: 'slice_of_life', icon: '🌸', label: '日常系好き' },
  { id: 'battle', icon: '⚔️', label: 'バトル好き' },
  { id: 'entertainment', icon: '🎪', label: 'エンタメ重視' },
];

interface SettingsModalProps {
  show: boolean;
  onClose: () => void;
  profile: UserProfile | null;
  avatarPublicUrl: string | null;
  saveProfile: (updates: {
    username?: string;
    handle?: string | null;
    bio?: string | null;
    is_public?: boolean;
    avatarFile?: File | null;
    otaku_type?: string;
    otaku_type_custom?: string | null;
  }) => Promise<{ success: boolean; error?: string }>;
  user: User | null;
  handleLogout?: () => void;
}

export function SettingsModal({
  show,
  onClose,
  profile,
  avatarPublicUrl,
  saveProfile,
  user,
  handleLogout,
}: SettingsModalProps) {
  const [username, setUsername] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // ========== オタクタイプのstate ==========
  const [otakuMode, setOtakuMode] = useState<'auto' | 'preset' | 'custom'>('auto');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customType, setCustomType] = useState('');
  
  const [saving, setSaving] = useState(false);

  // プロフィール情報を初期化
  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setHandle(profile.handle || '');
      setBio(profile.bio || '');
      setIsPublic(profile.is_public || false);
      
      // オタクタイプの初期化
      if (profile.otaku_type === 'auto' || !profile.otaku_type) {
        setOtakuMode('auto');
      } else if (profile.otaku_type === 'custom') {
        setOtakuMode('custom');
        setCustomType(profile.otaku_type_custom || '');
      } else {
        setOtakuMode('preset');
        setSelectedPreset(profile.otaku_type);
      }
    }
  }, [profile]);

  // アバターURLが変更されたときにプレビューを更新
  useEffect(() => {
    if (avatarPublicUrl) {
      setAvatarPreview(avatarPublicUrl);
    } else if (!avatarFile) {
      // アバターファイルが選択されていない場合のみリセット
      setAvatarPreview(null);
    }
  }, [avatarPublicUrl, avatarFile]);

  // 画像選択ハンドラ
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（5MBまで）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください。');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 保存ハンドラ
  const handleSave = async () => {
    setSaving(true);
    
    // オタクタイプの値を決定
    let otakuType = 'auto';
    let otakuTypeCustom: string | null = null;
    
    if (otakuMode === 'preset' && selectedPreset) {
      otakuType = selectedPreset;
    } else if (otakuMode === 'custom' && customType) {
      otakuType = 'custom';
      otakuTypeCustom = customType;
    }

    const result = await saveProfile({
      username,
      handle: handle || null,
      bio: bio || null,
      is_public: isPublic,
      avatarFile,
      otaku_type: otakuType,
      otaku_type_custom: otakuTypeCustom,
    });

    setSaving(false);
    
    if (result.success) {
      onClose();
    } else {
      alert(result.error || 'プロフィールの保存に失敗しました');
    }
  };

  if (!show) return null;

  return (
    <>
      {/* 未ログイン時の説明文 */}
      {!user && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-40">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            データは端末に保存されています。他の端末と同期したい場合やデータを永続的に保存したい場合はログインしてください。
          </p>
        </div>
      )}
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 w-full max-w-md ml-auto h-full shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold dark:text-white">プロフィール編集</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden />
            </button>
          </div>

          <div className="space-y-6">
            {/* ========== プロフィール画像 ========== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                プロフィール画像
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound className="w-8 h-8 text-gray-400" aria-hidden />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-[#e879d4] text-white rounded-lg hover:bg-[#f09fe3] transition-colors text-sm font-medium">
                  画像を選択
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                画像ファイルを選択してください（JPG、PNG、GIFなど、5MB以下）
              </p>
            </div>

            {/* ========== ユーザー名 ========== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ユーザー名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                placeholder="ユーザー名"
              />
            </div>

            {/* ========== ハンドル ========== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                @ハンドル
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 dark:text-gray-400 mr-1">@</span>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 30))}
                  className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                  placeholder="handle_name"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                英数字、アンダースコア(_)のみ使用可能。他のユーザーから検索される際に使用されます。
              </p>
            </div>

            {/* ========== オタクタイプ（新規追加） ========== */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                オタクタイプ
              </label>
              
              {/* モード選択 */}
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setOtakuMode('auto')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    otakuMode === 'auto'
                      ? 'bg-[#e879d4] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  自動判定
                </button>
                <button
                  type="button"
                  onClick={() => setOtakuMode('preset')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    otakuMode === 'preset'
                      ? 'bg-[#e879d4] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  選択
                </button>
                <button
                  type="button"
                  onClick={() => setOtakuMode('custom')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    otakuMode === 'custom'
                      ? 'bg-[#e879d4] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  カスタム
                </button>
              </div>

              {/* プリセット選択 */}
              {otakuMode === 'preset' && (
                <div className="grid grid-cols-2 gap-2">
                  {OTAKU_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedPreset(type.id)}
                      className={`p-2 rounded-lg text-left transition-all ${
                        selectedPreset === type.id
                          ? 'bg-[#e879d4]/20 border-2 border-[#e879d4]'
                          : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="text-sm text-gray-800 dark:text-white">{type.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* カスタム入力 */}
              {otakuMode === 'custom' && (
                <input
                  type="text"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value.slice(0, 10))}
                  placeholder="例: 原作厨"
                  maxLength={10}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                />
              )}

              {/* 自動判定の説明 */}
              {otakuMode === 'auto' && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  視聴傾向から自動的にタイプを判定します
                </p>
              )}
            </div>

            {/* ========== 公開設定 ========== */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                プロフィールを公開
              </label>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-[#e879d4]' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  isPublic ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* ========== 自己紹介（公開時のみ） ========== */}
            {isPublic && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自己紹介
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#e879d4]"
                  placeholder="自己紹介を入力..."
                />
              </div>
            )}
          </div>

          {/* ========== ボタン ========== */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-xl bg-[#e879d4] text-white hover:bg-[#f09fe3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>

          {/* ========== ログアウトボタン ========== */}
          {user && handleLogout && (
            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  if (confirm('ログアウトしますか？')) {
                    handleLogout();
                    onClose();
                  }
                }}
                className="w-full px-4 py-2 rounded-xl border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
