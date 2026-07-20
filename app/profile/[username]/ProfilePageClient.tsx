'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../lib/api';
import { getProfileByUsername, getPublicAnimes, getFollowCounts, isFollowing } from '../../lib/api';
import { followUser, unfollowUser } from '../../lib/api';
import type { User } from '@supabase/supabase-js';
import { useFeedback } from '../../contexts/FeedbackContext';

// アニメの型定義
type Anime = {
  id: number;
  title: string;
  image: string;
  rating: number;
  watched: boolean;
  rewatchCount?: number;
  tags?: string[];
};

interface ProfilePageClientProps {
  username: string;
  // サーバ側で取得済みの初期データ（SSRで本文を描画＝クローラ/AIが読める）。
  // 渡されない場合（後方互換）はクライアントで取得する。
  initialProfile?: UserProfile | null;
  initialAnimes?: Anime[];
  // ページ最上部に表示する可視パンくず(app/profile/[username]/page.tsx から Server Component として渡される)。
  // このページに固定ヘッダーは無いため、ヘッダー分のオフセットは不要。
  breadcrumb?: ReactNode;
}

export default function ProfilePageClient({
  username,
  initialProfile,
  initialAnimes,
  breadcrumb,
}: ProfilePageClientProps) {
  const router = useRouter();
  const { showToast } = useFeedback();

  const [profile, setProfile] = useState<UserProfile | null>(initialProfile ?? null);
  const [animes, setAnimes] = useState<Anime[]>(initialAnimes ?? []);
  const [followCounts, setFollowCounts] = useState<{ following: number; followers: number }>({
    following: 0,
    followers: 0,
  });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  // サーバから初期データが渡っていれば最初からローディング不要（SSRで本文が出る）
  const [isLoading, setIsLoading] = useState(initialProfile === undefined);

  useEffect(() => {
    const run = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);

        // SSRで初期データが無い場合（後方互換）のみ、プロフィール/視聴記録を取得
        let prof = initialProfile ?? null;
        if (initialProfile === undefined) {
          prof = await getProfileByUsername(username);
          setProfile(prof);
          if (prof) {
            const animesData = await getPublicAnimes(prof.id);
            setAnimes(animesData as Anime[]);
          }
          setIsLoading(false);
        }

        // インタラクティブ要素（フォロー数・フォロー状態）はクライアントで取得
        if (prof) {
          const counts = await getFollowCounts(prof.id);
          setFollowCounts(counts);
          if (user && user.id !== prof.id) {
            setIsFollowingUser(await isFollowing(prof.id));
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setIsLoading(false);
      }
    };

    run();
  }, [username, initialProfile]);

  const handleToggleFollow = async () => {
    if (!user || !profile) return;

    try {
      if (isFollowingUser) {
        await unfollowUser(profile.id);
        setIsFollowingUser(false);
      } else {
        await followUser(profile.id);
        setIsFollowingUser(true);
      }

      // フォロー数を更新
      const counts = await getFollowCounts(profile.id);
      setFollowCounts(counts);
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      showToast('フォロー操作に失敗しました', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 dark:text-gray-400">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            プロフィールが見つかりません
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#e879d4] text-white rounded-xl hover:bg-[#f09fe3] transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* このページに固定ヘッダーは無いため、パンくずはページ最上部にそのまま表示する */}
      {breadcrumb}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-[#e879d4] mb-4"
          >
            ← 戻る
          </button>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* プロフィールアイコン */}
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-[#e879d4] to-[#764ba2] flex items-center justify-center text-5xl shadow-lg">
              👤
            </div>

            {/* プロフィール情報 */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                    {profile.username}
                  </h1>
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{profile.bio}</p>
                  )}
                </div>

                {/* フォローボタン（自分のプロフィールの場合は非表示） */}
                {user && user.id !== profile.id && (
                  <button
                    onClick={handleToggleFollow}
                    className={`px-6 py-2 rounded-xl font-medium transition-colors ${
                      isFollowingUser
                        ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        : 'bg-[#e879d4] text-white hover:bg-[#f09fe3]'
                    }`}
                  >
                    {isFollowingUser ? 'フォロー中' : 'フォロー'}
                  </button>
                )}
              </div>

              {/* フォロー数・フォロワー数 */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {followCounts.following}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">フォロー中</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">
                    {followCounts.followers}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">フォロワー</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{animes.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">視聴作品</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 視聴履歴 */}
        {animes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">視聴履歴</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {animes.map((anime) => (
                <div
                  key={anime.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                >
                  <div className="aspect-(3/4) bg-linear-to-br from-[#e879d4] to-[#764ba2] flex items-center justify-center text-4xl">
                    {anime.image && anime.image.startsWith('http') ? (
                      <img
                        src={anime.image}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{anime.image || '🎬'}</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {anime.title}
                    </p>
                    {anime.rating > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= anime.rating
                                ? 'text-[#ffd700]'
                                : 'text-gray-300 dark:text-gray-600 opacity-30'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
