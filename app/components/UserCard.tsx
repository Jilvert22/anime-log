import { memo } from 'react';
import type { UserProfile } from '../lib/supabase';

function UserCardComponent({ 
  user, 
  onUserClick, 
  onFollowClick, 
  isFollowing 
}: { 
  user: UserProfile; 
  onUserClick: () => void;
  onFollowClick: () => void;
  isFollowing: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
      <button
        onClick={onUserClick}
        className="flex items-center gap-3 flex-1 text-left"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e879d4] to-[#764ba2] flex items-center justify-center text-2xl shrink-0">
          👤
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm dark:text-white truncate">{user.username}</p>
          {user.handle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">@{user.handle}</p>
          )}
          {user.bio && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{user.bio}</p>
          )}
        </div>
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFollowClick();
        }}
        className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors shrink-0 ${
          isFollowing
            ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
            : 'bg-[#e879d4] text-white hover:bg-[#f09fe3]'
        }`}
      >
        {isFollowing ? 'フォロー中' : 'フォロー'}
      </button>
    </div>
  );
}

// React.memoでメモ化
export const UserCard = memo(UserCardComponent);
