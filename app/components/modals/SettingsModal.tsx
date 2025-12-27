'use client';

import type { User } from '@supabase/supabase-js';
import type { Anime } from '../../types';
import type { UserProfile } from '../../lib/supabase';
import { otakuTypes } from '../../constants';
import { getMyProfile } from '../../lib/supabase';

export function SettingsModal({
  show,
  onClose,
  userName,
  setUserName,
  userIcon,
  setUserIcon,
  userHandle,
  setUserHandle,
  userOtakuType,
  setUserOtakuType,
  favoriteAnimeIds,
  setFavoriteAnimeIds,
  isProfilePublic,
  setIsProfilePublic,
  userBio,
  setUserBio,
  user,
  allAnimes,
  setShowFavoriteAnimeModal,
  upsertUserProfile,
  setMyProfile,
}: {
  show: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userIcon: string;
  setUserIcon: (icon: string) => void;
  userHandle: string;
  setUserHandle: (handle: string) => void;
  userOtakuType: string;
  setUserOtakuType: (type: string) => void;
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
  isProfilePublic: boolean;
  setIsProfilePublic: (isPublic: boolean) => void;
  userBio: string;
  setUserBio: (bio: string) => void;
  user: User | null;
  allAnimes: Anime[];
  setShowFavoriteAnimeModal: (show: boolean) => void;
  upsertUserProfile: (profile: { username: string; handle?: string | null; bio?: string; is_public?: boolean }) => Promise<boolean>;
  setMyProfile: (profile: UserProfile | null) => void;
}) {
  if (!show) return null;

  const handleSave = async () => {
    // プロフィール情報を保存
    if (user) {
      await upsertUserProfile({
        username: userName,
        handle: userHandle || null,
        bio: userBio,
        is_public: isProfilePublic,
      });
      // プロフィールを再読み込み
      const profile = await getMyProfile();
      if (profile) {
        setMyProfile(profile);
        setUserHandle(profile.handle || '');
      }
    }
    
    // localStorageに保存
    localStorage.setItem('userName', userName);
    localStorage.setItem('userIcon', userIcon);
    if (userOtakuType) {
      localStorage.setItem('userOtakuType', userOtakuType);
    } else {
      localStorage.removeItem('userOtakuType');
    }
    localStorage.setItem('favoriteAnimeIds', JSON.stringify(favoriteAnimeIds));
    onClose();
  };

  return (
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
            <h2 className="text-xl font-bold dark:text-white">設定</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>
          
          {/* ユーザー名入力 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              ユーザー名
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
              placeholder="ユーザー名を入力"
            />
          </div>

          {/* アイコン選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              アイコン
            </label>
            <div className="space-y-4">
              {/* 現在のアイコン表示 */}
              <div className="flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                  {userIcon && (userIcon.startsWith('http://') || userIcon.startsWith('https://') || userIcon.startsWith('data:')) ? (
                    <img
                      src={userIcon}
                      alt="アイコン"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const parent = (e.target as HTMLImageElement).parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-4xl">👤</span>';
                        }
                      }}
                    />
                  ) : (
                    <span className="text-4xl">{userIcon || '👤'}</span>
                  )}
                </div>
              </div>
              
              {/* 画像アップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  画像をアップロード
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result;
                        if (typeof result === 'string') {
                          setUserIcon(result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white text-sm"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  画像ファイルを選択してください（JPG、PNG、GIFなど）
                </p>
              </div>
              
              {/* 絵文字選択（オプション） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  または絵文字を選択
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {['👤', '😊', '🎮', '🎬', '📺', '🎨', '⚡', '🔥', '🌟', '💫', '🎯', '🚀', '🎪', '🎭', '🎸', '🎵', '🎹', '🎤', '🎧', '🎺', '🎷', '🥁', '🎲', '🎰'].map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setUserIcon(icon)}
                      className={`text-3xl p-2 rounded-lg transition-all ${
                        userIcon === icon
                          ? 'bg-[#e879d4]/20 dark:bg-[#e879d4]/20 ring-2 ring-indigo-500'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DNAカード編集セクション */}
          <div className="mb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">DNAカード編集</h3>
            
            {/* ハンドル入力（@で始まるID） */}
            {user && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  @ハンドル（DNAカードに表示されます）
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-400">@</span>
                  <input
                    type="text"
                    value={userHandle}
                    onChange={(e) => {
                      // 英数字、アンダースコア、ハイフンのみ許可、小文字に変換
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                      setUserHandle(value);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                    placeholder="handle"
                    maxLength={30}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  英数字、アンダースコア(_)のみ使用可能。他のユーザーから検索される際に使用されます。
                </p>
              </div>
            )}

            {/* オタクタイプ選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                オタクタイプ（DNAカードに表示されます）
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <button
                  onClick={() => setUserOtakuType('')}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    !userOtakuType
                      ? 'border-[#e879d4] bg-[#e879d4]/10 dark:bg-[#e879d4]/10'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#e879d4]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="font-medium dark:text-white">自動判定</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">タグから自動で判定されます</p>
                    </div>
                  </div>
                </button>
                {otakuTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setUserOtakuType(type.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      userOtakuType === type.value
                        ? 'border-[#e879d4] bg-[#e879d4]/10 dark:bg-[#e879d4]/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 hover:border-[#e879d4]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{type.emoji}</span>
                      <div>
                        <p className="font-medium dark:text-white">{type.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 最推し作品選択 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最推し作品（DNAカードに表示されます、最大3作品）
              </label>
              <button
                onClick={() => {
                  onClose();
                  setShowFavoriteAnimeModal(true);
                }}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 hover:border-[#e879d4] hover:text-[#e879d4] transition-colors"
              >
                {favoriteAnimeIds.length > 0
                  ? `${favoriteAnimeIds.length}作品が設定されています`
                  : '最推し作品を選択'}
              </button>
              {favoriteAnimeIds.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {favoriteAnimeIds.slice(0, 3).map((id) => {
                    const anime = allAnimes.find(a => a.id === id);
                    if (!anime) return null;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-1 bg-[#e879d4]/20 dark:bg-[#e879d4]/20 px-2 py-1 rounded-lg text-xs"
                      >
                        <span className="dark:text-white">{anime.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavoriteAnimeIds(favoriteAnimeIds.filter(fid => fid !== id));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* プロフィール公開設定 */}
          {user && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                プロフィールを公開
              </label>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <span className="text-sm dark:text-white">
                  {isProfilePublic ? '他のユーザーから見える' : '非公開'}
                </span>
                <button
                  onClick={() => setIsProfilePublic(!isProfilePublic)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isProfilePublic ? 'bg-[#e879d4]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      isProfilePublic ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {isProfilePublic && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    自己紹介（任意）
                  </label>
                  <textarea
                    value={userBio}
                    onChange={(e) => setUserBio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                    placeholder="自己紹介を入力..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleSave}
            className="w-full bg-[#e879d4] text-white py-3 rounded-xl font-bold hover:bg-[#f09fe3] transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
