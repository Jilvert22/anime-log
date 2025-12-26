'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../lib/supabase';
import { 
  getProfileByUsername, 
  getPublicAnimes, 
  getFollowCounts,
  isFollowing,
  followUser,
  unfollowUser
} from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

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

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [followCounts, setFollowCounts] = useState<{ following: number; followers: number }>({ following: 0, followers: 0 });
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 認証状態を確認
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();

    // プロフィールを読み込む
    const loadProfile = async () => {
      try {
        const profileData = await getProfileByUsername(username);
        if (!profileData) {
          setIsLoading(false);
          return;
        }
        
        setProfile(profileData);
        
        // アニメ一覧を読み込む
        const animesData = await getPublicAnimes(profileData.id);
        setAnimes(animesData as Anime[]);
        
        // フォロー数を取得
        const counts = await getFollowCounts(profileData.id);
        setFollowCounts(counts);
        
        // フォロー状態を確認
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id !== profileData.id) {
          const following = await isFollowing(profileData.id);
          setIsFollowingUser(following);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load profile:', error);
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [username]);

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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">プロフィールが見つかりません</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[#ffc2d1] text-white rounded-xl hover:bg-[#ffb07c] transition-colors"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 dark:text-gray-400 hover:text-[#ffc2d1] mb-4"
          >
            ← 戻る
          </button>
        </div>

        {/* プロフィールカード */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* プロフィールアイコン */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#ffc2d1] to-[#ffb07c] flex items-center justify-center text-5xl shadow-lg">
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
                        : 'bg-[#ffc2d1] text-white hover:bg-[#ffb07c]'
                    }`}
                  >
                    {isFollowingUser ? 'フォロー中' : 'フォロー'}
                  </button>
                )}
              </div>
              
              {/* フォロー数・フォロワー数 */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{followCounts.following}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">フォロー中</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-800 dark:text-white">{followCounts.followers}</p>
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
                  <div className="aspect-[3/4] bg-gradient-to-br from-[#ffc2d1] to-[#ffb07c] flex items-center justify-center text-4xl">
                    {anime.image && anime.image.startsWith('http') ? (
                      <img src={anime.image} alt={anime.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{anime.image || '🎬'}</span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{anime.title}</p>
                    {anime.rating > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= anime.rating
                                ? 'text-[#ffd966]'
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


