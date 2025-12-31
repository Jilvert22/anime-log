'use client';

import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '../../lib/api';
import type { Anime } from '../../types';
import { AnimeCard } from '../AnimeCard';

export function UserProfileModal({
  show,
  onClose,
  selectedUserProfile,
  selectedUserAnimes,
  user,
  userFollowStatus,
  onToggleFollow,
  onAnimeClick,
}: {
  show: boolean;
  onClose: () => void;
  selectedUserProfile: UserProfile | null;
  selectedUserAnimes: Anime[];
  user: User | null;
  userFollowStatus: { [userId: string]: boolean };
  onToggleFollow: (userId: string) => void;
  onAnimeClick: (anime: Anime) => void;
}) {
  if (!show || !selectedUserProfile) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-br from-[#e879d4] to-[#764ba2] flex items-center justify-center text-3xl shrink-0">
            👤
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold dark:text-white">{selectedUserProfile.username}</h2>
            {selectedUserProfile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedUserProfile.bio}</p>
            )}
          </div>
          {user && user.id !== selectedUserProfile.id && (
            <button
              onClick={() => onToggleFollow(selectedUserProfile.id)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                userFollowStatus[selectedUserProfile.id]
                  ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                  : 'bg-[#e879d4] text-white hover:bg-[#f09fe3]'
              }`}
            >
              {userFollowStatus[selectedUserProfile.id] ? 'フォロー中' : 'フォロー'}
            </button>
          )}
        </div>
        
        {/* 視聴作品数 */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400">視聴作品数</p>
          <p className="text-2xl font-bold dark:text-white">{selectedUserAnimes.length}作品</p>
        </div>
        
        {/* 視聴履歴 */}
        {selectedUserAnimes.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-lg mb-3 dark:text-white">視聴履歴</h3>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {selectedUserAnimes.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  onClick={() => {
                    onAnimeClick(anime);
                    onClose();
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
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
