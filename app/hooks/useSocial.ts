'use client';

/**
 * SNS機能（フォロー/フォロワー管理）のカスタムフック
 * 
 * @status 未使用（将来実装予定）
 * @todo SNS機能実装時に有効化
 * @see Phase 5でAPI層は移行済み（app/lib/api/social.ts）
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/api';
import type { Anime } from '../types';
import {
  searchUsers,
  getPublicProfile,
  getPublicAnimes,
  isFollowing,
  getFollowCounts,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
} from '../lib/api';
import { supabaseToAnime } from '../utils/helpers';
import type { SupabaseAnimeRow } from '../types';

type FollowStatus = Record<string, boolean>;
type FollowCounts = { following: number; followers: number };

export function useSocial(user: User | null) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [selectedUserAnimes, setSelectedUserAnimes] = useState<Anime[]>([]);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userFollowStatus, setUserFollowStatus] = useState<FollowStatus>({});
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ following: 0, followers: 0 });
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState<'following' | 'followers'>('following');
  const [followListUsers, setFollowListUsers] = useState<UserProfile[]>([]);

  // ログイン時にフォロー数を読み込む
  useEffect(() => {
    if (!user) {
      setFollowCounts({ following: 0, followers: 0 });
      return;
    }

    const loadFollowCounts = async () => {
      try {
        const counts = await getFollowCounts(user.id);
        setFollowCounts(counts);
      } catch (error) {
        console.error('フォロー数の読み込みに失敗しました:', error);
      }
    };

    loadFollowCounts();
  }, [user]);

  // フォロー/フォロワー一覧モーダルを開く際にデータを読み込む
  useEffect(() => {
    if (!showFollowListModal || !user) return;

    const loadFollowList = async () => {
      try {
        const list = followListType === 'following'
          ? await getFollowing(user.id)
          : await getFollowers(user.id);
        setFollowListUsers(list);
      } catch (error) {
        console.error('フォロー/フォロワー一覧の読み込みに失敗しました:', error);
      }
    };

    loadFollowList();
  }, [showFollowListModal, followListType, user]);

  const handleUserSearch = useCallback(async () => {
    if (!userSearchQuery.trim()) return;

    setIsSearchingUsers(true);
    try {
      const results = await searchUsers(userSearchQuery.trim());
      setSearchedUsers(results);

      // フォロー状態を確認
      if (user) {
        const followStatus: FollowStatus = {};
        await Promise.all(
          results.map(async (u) => {
            followStatus[u.id] = await isFollowing(u.id);
          })
        );
        setUserFollowStatus((prev) => ({ ...prev, ...followStatus }));
      }
    } catch (error) {
      console.error('ユーザー検索に失敗しました:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  }, [userSearchQuery, user]);

  const handleViewUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await getPublicProfile(userId);
      if (!profile) {
        alert('このユーザーのプロフィールは公開されていません');
        return;
      }

      const [animes, following] = await Promise.all([
        getPublicAnimes(userId),
        isFollowing(userId),
      ]);

      setSelectedUserProfile(profile);
      setSelectedUserAnimes(animes.map((a) => supabaseToAnime(a as SupabaseAnimeRow)));
      setUserFollowStatus((prev) => ({ ...prev, [userId]: following }));
      setShowUserProfileModal(true);
    } catch (error) {
      console.error('ユーザープロフィールの取得に失敗しました:', error);
      alert('プロフィールの取得に失敗しました');
    }
  }, []);

  const handleToggleFollow = useCallback(async (userId: string) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    const currentlyFollowing = userFollowStatus[userId] || false;

    try {
      if (currentlyFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      setUserFollowStatus((prev) => ({
        ...prev,
        [userId]: !currentlyFollowing,
      }));

      // フォロー数を更新
      const counts = await getFollowCounts(user.id);
      setFollowCounts(counts);
    } catch (error) {
      console.error('フォロー操作に失敗しました:', error);
      alert('フォロー操作に失敗しました');
    }
  }, [user, userFollowStatus]);

  return {
    userSearchQuery,
    setUserSearchQuery,
    searchedUsers,
    setSearchedUsers,
    isSearchingUsers,
    selectedUserProfile,
    setSelectedUserProfile,
    selectedUserAnimes,
    setSelectedUserAnimes,
    showUserProfileModal,
    setShowUserProfileModal,
    userFollowStatus,
    setUserFollowStatus,
    followCounts,
    setFollowCounts,
    showFollowListModal,
    setShowFollowListModal,
    followListType,
    setFollowListType,
    followListUsers,
    setFollowListUsers,
    handleUserSearch,
    handleViewUserProfile,
    handleToggleFollow,
  };
}
