'use client';

import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../../lib/supabase';
import { getFollowing, getFollowers } from '../../lib/supabase';
import { UserCard } from '../UserCard';

export function FollowListModal({
  show,
  onClose,
  user,
  followListType,
  setFollowListType,
  followListUsers,
  setFollowListUsers,
  userFollowStatus,
  onViewUserProfile,
  onToggleFollow,
}: {
  show: boolean;
  onClose: () => void;
  user: User | null;
  followListType: 'following' | 'followers';
  setFollowListType: (type: 'following' | 'followers') => void;
  followListUsers: UserProfile[];
  setFollowListUsers: (users: UserProfile[]) => void;
  userFollowStatus: { [userId: string]: boolean };
  onViewUserProfile: (userId: string) => void;
  onToggleFollow: (userId: string) => void;
}) {
  if (!show || !user) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3 mb-4">
          <button
            onClick={async () => {
              setFollowListType('following');
              const following = await getFollowing(user.id);
              setFollowListUsers(following);
            }}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              followListType === 'following'
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            フォロー中
          </button>
          <button
            onClick={async () => {
              setFollowListType('followers');
              const followers = await getFollowers(user.id);
              setFollowListUsers(followers);
            }}
            className={`flex-1 py-2 rounded-xl font-medium transition-colors ${
              followListType === 'followers'
                ? 'bg-[#e879d4] text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            フォロワー
          </button>
        </div>
        
        <div className="space-y-3">
          {followListUsers.length > 0 ? (
            followListUsers.map((u) => (
              <UserCard
                key={u.id}
                user={u}
                onUserClick={() => {
                  onClose();
                  onViewUserProfile(u.id);
                }}
                onFollowClick={() => onToggleFollow(u.id)}
                isFollowing={userFollowStatus[u.id] || false}
              />
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {followListType === 'following' ? 'フォロー中のユーザーがいません' : 'フォロワーがいません'}
            </p>
          )}
        </div>
        
        <button
          onClick={onClose}
          className="w-full mt-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
