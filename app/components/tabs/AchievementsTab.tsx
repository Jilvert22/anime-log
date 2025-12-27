'use client';

import { useState, useEffect } from 'react';
import type { Anime, Achievement } from '../../types';

export function AchievementsTab({ 
  allAnimes, 
  achievements, 
  user, 
  supabase 
}: { 
  allAnimes: Anime[]; 
  achievements: Achievement[];
  user: any;
  supabase: any;
}) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [reviewStats, setReviewStats] = useState<{
    reviewCount: number;
    totalLikes: number;
    totalHelpful: number;
  }>({ reviewCount: 0, totalLikes: 0, totalHelpful: 0 });
  
  // 感想統計を取得
  useEffect(() => {
    const loadReviewStats = async () => {
      if (!user || !supabase) {
        setReviewStats({ reviewCount: 0, totalLikes: 0, totalHelpful: 0 });
        return;
      }
      
      try {
        // 自分の感想をすべて取得
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('id, likes, helpful_count')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        const reviewCount = reviews?.length || 0;
        const totalLikes = reviews?.reduce((sum: number, r: any) => sum + (r.likes || 0), 0) || 0;
        const totalHelpful = reviews?.reduce((sum: number, r: any) => sum + (r.helpful_count || 0), 0) || 0;
        
        setReviewStats({ reviewCount, totalLikes, totalHelpful });
      } catch (error) {
        console.error('Failed to load review stats:', error);
        setReviewStats({ reviewCount: 0, totalLikes: 0, totalHelpful: 0 });
      }
    };
    
    loadReviewStats();
  }, [user, supabase]);
  
  // 実績の解除判定
  const checkAchievement = (achievement: Achievement): boolean => {
    const watchedCount = allAnimes.filter(a => a.watched).length;
    const maxRewatchCount = Math.max(...allAnimes.map(a => a.rewatchCount ?? 0), 0);
    const godTasteCount = allAnimes.filter(a => a.rating === 5).length;
    
    switch (achievement.id) {
      case 'first':
        return watchedCount >= achievement.condition;
      case 'ten':
      case 'fifty':
      case 'hundred':
        return watchedCount >= achievement.condition;
      case 'rewatch3':
      case 'rewatch10':
        return maxRewatchCount >= achievement.condition;
      case 'godtaste':
        return godTasteCount >= achievement.condition;
      // 感想関連実績
      case 'review1':
      case 'review10':
      case 'review50':
        return reviewStats.reviewCount >= achievement.condition;
      case 'liked10':
      case 'liked50':
        return reviewStats.totalLikes >= achievement.condition;
      case 'helpful10':
        return reviewStats.totalHelpful >= achievement.condition;
      default:
        return false;
    }
  };
  
  const unlockedCount = achievements.filter(a => checkAchievement(a)).length;
  
  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-400 dark:bg-gray-500';
      case 'rare':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'epic':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'legendary':
        return 'bg-yellow-500 dark:bg-yellow-600';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <>
      {/* 進捗表示 */}
      <div className="mb-6 text-center">
        <p className="text-2xl font-black dark:text-white">
          {unlockedCount}/{achievements.length} 解除済み
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-[#ff6b9d] h-2 rounded-full transition-all"
            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* バッジグリッド */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {achievements.map((achievement) => {
          const isUnlocked = checkAchievement(achievement);
          const rarityColor = getRarityColor(achievement.rarity);
          
          return (
            <button
              key={achievement.id}
              onClick={() => setSelectedAchievement(achievement)}
              className={`relative aspect-square rounded-2xl p-4 flex flex-col items-center justify-center transition-all ${
                isUnlocked
                  ? `${rarityColor} ${achievement.rarity === 'legendary' ? 'animate-pulse' : ''} shadow-lg hover:scale-105`
                  : 'bg-gray-200 dark:bg-gray-700 opacity-50'
              }`}
            >
              {!isUnlocked && (
                <span className="absolute top-1 right-1 text-xs">🔒</span>
              )}
              <span className="text-4xl mb-2">{achievement.icon}</span>
              <span className={`text-xs font-bold text-center ${isUnlocked ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                {achievement.name}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* 詳細モーダル */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm lg:max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <span className="text-6xl mb-2 block">{selectedAchievement.icon}</span>
              <h3 className="text-xl font-bold dark:text-white mb-1">{selectedAchievement.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{selectedAchievement.desc}</p>
            </div>
            
            <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <span className="font-bold">解除条件:</span> {selectedAchievement.desc}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                レア度: {selectedAchievement.rarity}
              </p>
            </div>
            
            <button 
              onClick={() => setSelectedAchievement(null)}
              className="w-full bg-[#ff6b9d] text-white py-3 rounded-xl font-bold hover:bg-[#ff8a65] transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
