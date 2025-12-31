import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are not set. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.');
  console.error('Current values:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl.length,
    keyLength: supabaseAnonKey.length,
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        credentials: 'omit', // CORSエラーを防ぐため、credentialsをomitに設定
      });
    },
  },
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: true,
    persistSession: true,
    storageKey: 'animelog-auth',
    autoRefreshToken: true,
  },
});

// SNS機能用の型定義
export type UserProfile = {
  id: string;
  username: string;
  handle: string | null; // @で始まるハンドル（@なしで保存）
  bio: string | null;
  is_public: boolean;
  otaku_type: string | null; // 'auto' | プリセット名 | null
  otaku_type_custom: string | null; // カスタム入力の場合のテキスト
  avatar_url: string | null; // Supabase StorageのURL
  created_at: string;
  updated_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

// UUID形式かどうかを判定する関数
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// ハンドル形式かどうかを判定する関数（@で始まる、英数字・アンダースコア・ハイフンのみ）
function isHandle(str: string): boolean {
  const handleRegex = /^@?[a-z0-9_]+$/i;
  return handleRegex.test(str);
}

// ハンドルから@を除去して正規化
function normalizeHandle(handle: string): string {
  return handle.startsWith('@') ? handle.substring(1).toLowerCase() : handle.toLowerCase();
}

// ユーザー検索（ユーザー名またはハンドルで検索）
export async function searchUsers(query: string): Promise<UserProfile[]> {
  if (!query.trim()) return [];
  
  const trimmedQuery = query.trim();
  
  // ハンドル形式の場合はhandleで検索
  if (isHandle(trimmedQuery)) {
    const normalizedHandle = normalizeHandle(trimmedQuery);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('handle', normalizedHandle)
      .eq('is_public', true)
      .limit(20);
    
    if (error) {
      console.error('Failed to search users by handle:', error);
      return [];
    }
    
    return data || [];
  }
  
  // ユーザー名で検索
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .ilike('username', `%${trimmedQuery}%`)
    .eq('is_public', true)
    .limit(20);
  
  if (error) {
    console.error('Failed to search users:', error);
    return [];
  }
  
  return data || [];
}

// おすすめユーザー取得（公開プロフィールのユーザー）
export async function getRecommendedUsers(limit: number = 10): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Failed to get recommended users:', error);
    return [];
  }
  
  return data || [];
}

// ユーザーをフォロー
export async function followUser(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('follows')
    .insert({
      follower_id: user.id,
      following_id: followingId,
    });
  
  if (error) {
    console.error('Failed to follow user:', error);
    return false;
  }
  
  return true;
}

// ユーザーのフォローを解除
export async function unfollowUser(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId);
  
  if (error) {
    console.error('Failed to unfollow user:', error);
    return false;
  }
  
  return true;
}

// フォロワー一覧取得
export async function getFollowers(userId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('following_id', userId);
  
  if (error) {
    console.error('Failed to get followers:', error);
    return [];
  }
  
  if (!data || data.length === 0) return [];
  
  const followerIds = data.map((item: { follower_id: string }) => item.follower_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', followerIds);
  
  if (profilesError) {
    console.error('Failed to get follower profiles:', profilesError);
    return [];
  }
  
  return profiles || [];
}

// フォロー中一覧取得
export async function getFollowing(userId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);
  
  if (error) {
    console.error('Failed to get following:', error);
    return [];
  }
  
  if (!data || data.length === 0) return [];
  
  const followingIds = data.map((item: { following_id: string }) => item.following_id);
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .in('id', followingIds);
  
  if (profilesError) {
    console.error('Failed to get following profiles:', profilesError);
    return [];
  }
  
  return profiles || [];
}

// 公開プロフィール取得
export async function getPublicProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .eq('is_public', true)
    .single();
  
  if (error) {
    console.error('Failed to get public profile:', error);
    return null;
  }
  
  return data;
}

// 公開アニメ一覧取得
export async function getPublicAnimes(userId: string): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('animes')
    .select('*')
    .eq('user_id', userId)
    .eq('watched', true)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get public animes:', error);
    return [];
  }
  
  return data || [];
}

// フォロー状態を確認
export async function isFollowing(followingId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', followingId)
    .single();
  
  if (error || !data) return false;
  return true;
}

// フォロー数・フォロワー数を取得
export async function getFollowCounts(userId: string): Promise<{ following: number; followers: number }> {
  const [followingResult, followersResult] = await Promise.all([
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', userId),
    supabase
      .from('follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', userId),
  ]);
  
  return {
    following: followingResult.count || 0,
    followers: followersResult.count || 0,
  };
}

// アバター画像をSupabase Storageにアップロード
export async function uploadAvatar(file: File): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // ファイル拡張子を取得
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}/${Date.now()}.${extension}`;

    // 既存のアバターを削除（オプション）
    try {
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(user.id);
      
      if (existingFiles && existingFiles.length > 0) {
        // 古いファイルを削除（最新の1つだけ保持する場合）
        const filesToDelete = existingFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage
          .from('avatars')
          .remove(filesToDelete);
      }
    } catch (error) {
      // 既存ファイルの削除に失敗しても続行（初回アップロードの場合など）
      console.warn('Failed to delete existing avatars:', error);
    }

    // 新しいファイルをアップロード
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Failed to upload avatar:', error);
      return null;
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

// プロフィール作成・更新
export async function upsertUserProfile(profile: {
  username: string;
  handle?: string | null;
  bio?: string;
  is_public?: boolean;
  otaku_type?: string | null;
  otaku_type_custom?: string | null;
  avatar_url?: string | null;
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // 既存のプロフィールを取得
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('handle')
    .eq('id', user.id)
    .single();
  
  // handleを正規化（@を除去、小文字に変換）
  // 空文字列の場合はnullに変換（UNIQUE制約のため）
  let normalizedHandle = null;
  if (profile.handle && profile.handle.trim() !== '') {
    normalizedHandle = normalizeHandle(profile.handle);
    // 正規化後も空文字列になった場合はnullに
    if (normalizedHandle === '') {
      normalizedHandle = null;
    } else {
      // handleが変更される場合のみ重複チェック（自分自身のハンドルは除外）
      if (existingProfile?.handle !== normalizedHandle) {
        const { data: duplicateCheck } = await supabase
          .from('user_profiles')
          .select('id, username')
          .eq('handle', normalizedHandle)
          .neq('id', user.id)
          .maybeSingle();
        
        if (duplicateCheck) {
          console.error('Handle already taken:', normalizedHandle, 'by user:', duplicateCheck.id);
          throw new Error(`ハンドル「@${normalizedHandle}」は既に使用されています`);
        }
      }
    }
  }
  
  const normalizedProfile = {
    ...profile,
    handle: normalizedHandle,
    // otaku_type, otaku_type_custom, avatar_url も含める
    otaku_type: profile.otaku_type || null,
    otaku_type_custom: profile.otaku_type_custom || null,
    avatar_url: profile.avatar_url || null,
  };
  
  const { error, data } = await supabase
    .from('user_profiles')
    .upsert({
      id: user.id,
      ...normalizedProfile,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });
  
  if (error) {
    console.error('Failed to upsert user profile:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    console.error('Profile data:', normalizedProfile);
    console.error('User ID:', user.id);
    return false;
  }
  
  console.log('Profile upserted successfully:', data);
  
  return true;
}

// 自分のプロフィール取得
export async function getMyProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) {
    // プロフィールが存在しない場合はnullを返す
    if (error.code === 'PGRST116') return null;
    console.error('Failed to get my profile:', error);
    return null;
  }
  
  return data;
}

// usernameで公開プロフィールを取得
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('username', username)
    .eq('is_public', true)
    .single();
  
  if (error) {
    // プロフィールが存在しない場合はnullを返す
    if (error.code === 'PGRST116') return null;
    console.error('Failed to get profile by username:', error);
    return null;
  }
  
  return data;
}

// handleで公開プロフィールを取得
export async function getProfileByHandle(handle: string): Promise<UserProfile | null> {
  const normalizedHandle = normalizeHandle(handle);
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('handle', normalizedHandle)
    .eq('is_public', true)
    .single();
  
  if (error) {
    // プロフィールが存在しない場合はnullを返す
    if (error.code === 'PGRST116') return null;
    console.error('Failed to get profile by handle:', error);
    return null;
  }
  
  return data;
}

// 積みアニメの型定義
export type WatchlistItem = {
  id: string;
  user_id: string;
  anilist_id: number;
  title: string;
  image: string | null;
  memo: string | null;
  created_at: string;
  // 今シーズン視聴予定機能用
  status?: 'planned' | 'watching' | 'completed' | null;
  season_year?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  // 放送情報
  broadcast_day?: number | null; // 0-6 (0=日曜)
  broadcast_time?: string | null; // HH:mm形式
};

// 積みアニメ一覧を取得
export async function getWatchlist(userId?: string): Promise<WatchlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  if (!targetUserId) return [];
  
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get watchlist:', error);
    return [];
  }
  
  return data || [];
}

// 積みアニメを追加（anilist_idが-1の場合は重複チェックなし）
export async function addToWatchlist(item: {
  anilist_id: number;
  title: string;
  image?: string | null;
  memo?: string | null;
  // 今シーズン視聴予定機能用
  status?: 'planned' | 'watching' | 'completed' | null;
  season_year?: number | null;
  season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  // 放送情報
  broadcast_day?: number | null;
  broadcast_time?: string | null;
}): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // anilist_idが-1でない場合は重複チェック
  if (item.anilist_id !== -1) {
    const { data: existing } = await supabase
      .from('watchlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('anilist_id', item.anilist_id)
      .single();
    
    if (existing) {
      // 既に登録されている場合は成功とみなす
      return true;
    }
  }
  
  const { error } = await supabase
    .from('watchlist')
    .insert({
      user_id: user.id,
      anilist_id: item.anilist_id,
      title: item.title,
      image: item.image || null,
      memo: item.memo || null,
      status: item.status || null,
      season_year: item.season_year || null,
      season: item.season || null,
      broadcast_day: item.broadcast_day || null,
      broadcast_time: item.broadcast_time || null,
    });
  
  if (error) {
    console.error('Failed to add to watchlist:', error);
    return false;
  }
  
  return true;
}

// 積みアニメを削除
export async function removeFromWatchlist(anilistId: number): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .eq('anilist_id', anilistId);
  
  if (error) {
    console.error('Failed to remove from watchlist:', error);
    return false;
  }
  
  return true;
}

// 積みアニメを更新（メモ、ステータスなど）
export async function updateWatchlistItem(
  anilistId: number,
  updates: { 
    memo?: string | null;
    status?: 'planned' | 'watching' | 'completed' | null;
    season_year?: number | null;
    season?: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL' | null;
  }
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { error } = await supabase
    .from('watchlist')
    .update(updates)
    .eq('user_id', user.id)
    .eq('anilist_id', anilistId);
  
  if (error) {
    console.error('Failed to update watchlist item:', error);
    return false;
  }
  
  return true;
}

// 複数アイテムのステータスを一括更新
export async function updateWatchlistItemsStatus(
  ids: string[],
  status: 'planned' | 'watching' | 'completed' | null
): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || ids.length === 0) return false;
  
  const { error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('user_id', user.id)
    .in('id', ids);
  
  if (error) {
    console.error('Failed to update watchlist items status:', error);
    return false;
  }
  
  return true;
}

// 複数アイテムを一括削除
export async function deleteWatchlistItems(ids: string[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || ids.length === 0) return false;
  
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('user_id', user.id)
    .in('id', ids);
  
  if (error) {
    console.error('Failed to delete watchlist items:', error);
    return false;
  }
  
  return true;
}

// 指定シーズンの視聴予定アニメを取得
export async function getSeasonWatchlist(
  userId: string,
  year: number,
  season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL',
  status?: 'planned' | 'watching' | 'completed'
): Promise<WatchlistItem[]> {
  if (!userId) return [];
  
  let query = supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('season_year', year)
    .eq('season', season)
    .not('status', 'is', null);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get season watchlist:', error);
    return [];
  }
  
  return data || [];
}

// 今期（現在のシーズン）の視聴予定アニメを取得
export async function getCurrentSeasonWatchlist(
  userId?: string,
  status?: 'planned' | 'watching' | 'completed'
): Promise<WatchlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  if (!targetUserId) return [];
  
  // 今期のシーズンを取得
  const { getCurrentSeason } = await import('../utils/helpers');
  const { year, season } = getCurrentSeason();
  
  return getSeasonWatchlist(targetUserId, year, season, status);
}

// 来期（次のシーズン）の視聴予定アニメを取得
export async function getNextSeasonWatchlist(
  userId?: string,
  status?: 'planned' | 'watching' | 'completed'
): Promise<WatchlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  if (!targetUserId) return [];
  
  // 来期のシーズンを取得
  const { getNextSeason } = await import('../utils/helpers');
  const { year, season } = getNextSeason();
  
  return getSeasonWatchlist(targetUserId, year, season, status);
}

// 今期（現在のシーズン）で視聴予定（planned）のアニメを取得
// 「来期」が「今期」になった時点で、視聴予定のアニメをチェックするために使用
export async function getCurrentSeasonPlannedWatchlist(
  userId?: string
): Promise<WatchlistItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const targetUserId = userId || user?.id;
  if (!targetUserId) return [];
  
  // 現在のシーズンを取得
  const { getCurrentSeason } = await import('../utils/helpers');
  const { year, season } = getCurrentSeason();
  
  // 今期で視聴予定（planned）のアニメを取得
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('user_id', targetUserId)
    .eq('season_year', year)
    .eq('season', season)
    .eq('status', 'planned')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Failed to get current season planned watchlist:', error);
    return [];
  }
  
  return data || [];
}