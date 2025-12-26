'use client';

import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../lib/supabase';
import type { Anime } from '../types';
import {
  searchUsers,
  getRecommendedUsers,
  getPublicProfile,
  getPublicAnimes,
  isFollowing,
  followUser,
  unfollowUser,
  getFollowCounts,
  getFollowers,
  getFollowing,
} from '../lib/supabase';
import { supabaseToAnime } from '../utils/helpers';

export function useSocial(user: User | null) {
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState<UserProfile[]>([]);
  const [recommendedUsers, setRecommendedUsers] = useState<UserProfile[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [selectedUserAnimes, setSelectedUserAnimes] = useState<Anime[]>([]);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [userFollowStatus, setUserFollowStatus] = useState<{ [userId: string]: boolean }>({});
  const [followCounts, setFollowCounts] = useState<{ following: number; followers: number }>({ following: 0, followers: 0 });
  const [showFollowListModal, setShowFollowListModal] = useState(false);
  const [followListType, setFollowListType] = useState<'following' | 'followers'>('following');
  const [followListUsers, setFollowListUsers] = useState<UserProfile[]>([]);

  // フォロー/フォロワー一覧モーダルを開く際にデータを読み込む
  useEffect(() => {
    if (showFollowListModal && user) {
      const loadFollowList = async () => {
        try {
          if (followListType === 'following') {
            const following = await getFollowing(user.id);
            setFollowListUsers(following);
          } else {
            const followers = await getFollowers(user.id);
            setFollowListUsers(followers);
          }
        } catch (error) {
          console.error('Failed to load follow list:', error);
        }
      };
      
      loadFollowList();
    }
  }, [showFollowListModal, followListType, user]);

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) return;
    
    setIsSearchingUsers(true);
    try {
      const results = await searchUsers(userSearchQuery.trim());
      setSearchedUsers(results);
      
      // フォロー状態を確認
      if (user) {
        const followStatus: { [userId: string]: boolean } = {};
        await Promise.all(
          results.map(async (u) => {
            followStatus[u.id] = await isFollowing(u.id);
          })
        );
        setUserFollowStatus(prev => ({ ...prev, ...followStatus }));
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleViewUserProfile = async (userId: string) => {
    try {
      const profile = await getPublicProfile(userId);
      if (!profile) {
        alert('このユーザーのプロフィールは公開されていません');
        return;
      }
      
      const animes = await getPublicAnimes(userId);
      const following = await isFollowing(userId);
      
      setSelectedUserProfile(profile);
      setSelectedUserAnimes(animes.map(a => supabaseToAnime(a)));
      setUserFollowStatus(prev => ({ ...prev, [userId]: following }));
      setShowUserProfileModal(true);
    } catch (error) {
      console.error('Failed to view user profile:', error);
      alert('プロフィールの取得に失敗しました');
    }
  };

  const handleToggleFollow = async (userId: string) => {
    if (!user) {
      alert('ログインが必要です');
      return;
    }
    
    const currentlyFollowing = userFollowStatus[userId] || false;
    
    try {
      let success = false;
      if (currentlyFollowing) {
        success = await unfollowUser(userId);
      } else {
        success = await followUser(userId);
      }
      
      if (success) {
        setUserFollowStatus(prev => ({
          ...prev,
          [userId]: !currentlyFollowing,
        }));
        
        // フォロー数を更新
        if (user) {
          const counts = await getFollowCounts(user.id);
          setFollowCounts(counts);
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      alert('フォロー操作に失敗しました');
    }
  };

  return {
    userSearchQuery,
    setUserSearchQuery,
    searchedUsers,
    setSearchedUsers,
    recommendedUsers,
    setRecommendedUsers,
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

