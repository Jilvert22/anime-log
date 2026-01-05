'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { getAnimeDetail, getBroadcastInfo, getOfficialSiteUrl, type AniListMedia } from '../../lib/anilist';
import { ExternalLink } from 'lucide-react';
import type { AniListMediaWithStreaming } from '../../lib/api/annict';
import type { WatchlistItem } from '../../lib/storage/types';
import { useStorage } from '../../hooks/useStorage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { StreamingBadges } from '../common/StreamingBadges';
import { StreamingUpdateButton } from '../common/StreamingUpdateButton';
import { updateWatchlistStreamingInfo } from '../../lib/api/streamingUpdate';
// 通知設定 - 将来の実装用にコメントアウト
// import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../../lib/push-notifications';

interface WatchlistDetailSheetProps {
  item?: WatchlistItem | null;
  animeMedia?: AniListMedia | AniListMediaWithStreaming | null;
  onClose: () => void;
  onUpdate?: () => void;
  isWatchlistMode?: boolean; // 積みアニメモードかどうか
  onMarkAsWatched?: (item: WatchlistItem) => void; // 視聴済みにするコールバック（積みアニメ用）
}

export function WatchlistDetailSheet({ item, animeMedia, onClose, onUpdate, isWatchlistMode = false, onMarkAsWatched }: WatchlistDetailSheetProps) {
  const [animeDetail, setAnimeDetail] = useState<AniListMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(false);
  const [broadcastDay, setBroadcastDay] = useState<number | null>(null);
  const [broadcastTime, setBroadcastTime] = useState<string>('');
  const [currentItem, setCurrentItem] = useState<WatchlistItem | null | undefined>(item);
  // 通知設定 - 将来の実装用にコメントアウト
  // const [notificationEnabled, setNotificationEnabled] = useState(false);
  // const [notificationTiming, setNotificationTiming] = useState<string[]>(['1hour']);
  // const [loadingNotification, setLoadingNotification] = useState(false);
  // const [customTime, setCustomTime] = useState<string>('09:00');
  // const [showCustomTime, setShowCustomTime] = useState(false);
  const storage = useStorage();
  const { user } = useAuth();

  // 表示するタイトルを決定（item優先、次にanimeMedia、最後にanimeDetail）
  const displayTitle = item?.title || 
    animeMedia?.title?.native || 
    animeMedia?.title?.romaji || 
    animeDetail?.title?.native || 
    animeDetail?.title?.romaji || 
    'タイトル不明';

  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

  // 日本語判定関数（ひらがな・カタカナ・漢字が含まれているかチェック）
  const hasJapaneseCharacters = (text: string): boolean => {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
  };

  useEffect(() => {
    // animeMediaが直接渡されている場合でも、詳細情報を取得する
    // （description、tags、trailer、averageScore、durationなどはanimeMediaには含まれていない可能性があるため）
    const anilistId = item?.anilist_id || animeMedia?.id;
    if (anilistId) {
      loadAnimeDetail();
    }
  }, [item?.anilist_id, animeMedia?.id]);

  useEffect(() => {
    if (item) {
      setBroadcastDay(item.broadcast_day ?? null);
      setBroadcastTime(item.broadcast_time || '');
      setCurrentItem(item);
    }
  }, [item]);

  // 通知設定 - 将来の実装用にコメントアウト
  // useEffect(() => {
  //   // userとitemの両方が揃ったら通知設定を読み込む
  //   if (user && item?.id) {
  //     loadNotificationSettings();
  //   } else {
  //     // userまたはitemがない場合は通知設定をリセット
  //     setNotificationEnabled(false);
  //     setNotificationTiming(['1hour']);
  //     setShowCustomTime(false);
  //     setLoadingNotification(false);
  //   }
  // }, [user, item?.id]);

  // 通知設定 - 将来の実装用にコメントアウト
  // const loadNotificationSettings = async () => {
  //   if (!user || !item?.id) {
  //     setNotificationEnabled(false);
  //     setNotificationTiming(['1hour']);
  //     setShowCustomTime(false);
  //     setLoadingNotification(false);
  //     return;
  //   }
  //   
  //   setLoadingNotification(true);
  //   try {
  //     const { data, error } = await supabase
  //       .from('notification_settings')
  //       .select('enabled, timing')
  //       .eq('user_id', user.id)
  //       .eq('watchlist_id', item.id)
  //       .maybeSingle();
  //     
  //     if (error) {
  //       if (error.message?.includes('406') || String(error).includes('406')) {
  //         console.warn('通知設定の取得で406エラーが発生しました:', error);
  //       }
  //       setNotificationEnabled(false);
  //       setNotificationTiming(['1hour']);
  //       setShowCustomTime(false);
  //       return;
  //     }
  //     
  //     if (data) {
  //       setNotificationEnabled(data.enabled);
  //       const timing = data.timing || ['1hour'];
  //       setNotificationTiming(timing);
  //       
  //       const customTiming = timing.find((t: string) => t.startsWith('custom:'));
  //       if (customTiming) {
  //         const time = customTiming.replace('custom:', '');
  //         setCustomTime(time);
  //         setShowCustomTime(true);
  //       } else {
  //         setShowCustomTime(false);
  //       }
  //     } else {
  //       setNotificationEnabled(false);
  //       setNotificationTiming(['1hour']);
  //       setShowCustomTime(false);
  //     }
  //   } catch (error) {
  //     console.error('通知設定の取得に失敗しました:', error);
  //     setNotificationEnabled(false);
  //     setNotificationTiming(['1hour']);
  //     setShowCustomTime(false);
  //   } finally {
  //     setLoadingNotification(false);
  //   }
  // };

  // 通知設定 - 将来の実装用にコメントアウト
  // const handleNotificationToggle = async (enabled: boolean) => {
  //   if (!user || !item?.id) {
  //     return;
  //   }
  //   
  //   if (loadingNotification) {
  //     return;
  //   }
  //   
  //   if (enabled) {
  //     try {
  //       const permission = await Notification.requestPermission();
  //       if (permission !== 'granted') {
  //         alert('通知を有効にするには、ブラウザの通知権限が必要です。\n\niOSではホーム画面に追加すると通知が届きます。');
  //         return;
  //       }
  //     } catch (error) {
  //       console.error('通知権限のリクエストに失敗しました:', error);
  //       alert('通知権限のリクエストに失敗しました');
  //       return;
  //     }
  //   }
  //   
  //   setLoadingNotification(true);
  //   try {
  //     if (enabled) {
  //       try {
  //         await subscribeToPushNotifications(user);
  //       } catch (error) {
  //         console.error('プッシュ通知の購読に失敗しました:', error);
  //         alert('プッシュ通知の購読に失敗しました。後でもう一度お試しください。');
  //         setLoadingNotification(false);
  //         return;
  //       }
  //     } else {
  //       try {
  //         await unsubscribeFromPushNotifications(user);
  //       } catch (error) {
  //         console.error('プッシュ通知の購読解除に失敗しました:', error);
  //       }
  //     }
  //     
  //     const { error } = await supabase
  //       .from('notification_settings')
  //       .upsert({
  //         user_id: user.id,
  //         watchlist_id: item.id,
  //         enabled,
  //         timing: notificationTiming,
  //         updated_at: new Date().toISOString(),
  //       }, {
  //         onConflict: 'user_id,watchlist_id'
  //       });
  //     
  //     if (error) {
  //       if (error.message?.includes('406') || String(error).includes('406')) {
  //         console.warn('通知設定の保存で406エラーが発生しました:', error);
  //       } else {
  //         throw error;
  //       }
  //     }
  //     
  //     setNotificationEnabled(enabled);
  //   } catch (error) {
  //     console.error('通知設定の更新に失敗しました:', error);
  //     alert('通知設定の更新に失敗しました');
  //     setNotificationEnabled(!enabled);
  //   } finally {
  //     setLoadingNotification(false);
  //   }
  // };

  // 通知設定 - 将来の実装用にコメントアウト
  // const handleTimingChange = async (timing: string) => {
  //   if (!user || !item?.id || loadingNotification) return;
  //   const newTiming = notificationTiming.includes(timing)
  //     ? notificationTiming.filter(t => t !== timing)
  //     : [...notificationTiming, timing];
  //   setNotificationTiming(newTiming);
  //   setLoadingNotification(true);
  //   try {
  //     const { error } = await supabase
  //       .from('notification_settings')
  //       .upsert({
  //         user_id: user.id,
  //         watchlist_id: item.id,
  //         enabled: notificationEnabled,
  //         timing: newTiming,
  //         updated_at: new Date().toISOString(),
  //       }, {
  //         onConflict: 'user_id,watchlist_id'
  //       });
  //     if (error) {
  //       if (error.message?.includes('406') || String(error).includes('406')) {
  //         console.warn('通知タイミングの保存で406エラーが発生しました:', error);
  //       } else {
  //         throw error;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('通知タイミングの更新に失敗しました:', error);
  //     setNotificationTiming(notificationTiming);
  //     alert('通知タイミングの更新に失敗しました');
  //   } finally {
  //     setLoadingNotification(false);
  //   }
  // };

  // const handleCustomTimeChange = async (time: string) => {
  //   if (!user || !item?.id || loadingNotification) return;
  //   setCustomTime(time);
  //   const customTiming = `custom:${time}`;
  //   const newTiming = notificationTiming.filter(t => !t.startsWith('custom:'));
  //   if (showCustomTime) {
  //     newTiming.push(customTiming);
  //   }
  //   setLoadingNotification(true);
  //   try {
  //     const { error } = await supabase
  //       .from('notification_settings')
  //       .upsert({
  //         user_id: user.id,
  //         watchlist_id: item.id,
  //         enabled: notificationEnabled,
  //         timing: newTiming,
  //         updated_at: new Date().toISOString(),
  //       }, {
  //         onConflict: 'user_id,watchlist_id'
  //       });
  //     if (error) {
  //       if (error.message?.includes('406') || String(error).includes('406')) {
  //         console.warn('通知タイミングの保存で406エラーが発生しました:', error);
  //       } else {
  //         throw error;
  //       }
  //     }
  //     setNotificationTiming(newTiming);
  //   } catch (error) {
  //     console.error('カスタム時間の更新に失敗しました:', error);
  //     alert('カスタム時間の更新に失敗しました');
  //   } finally {
  //     setLoadingNotification(false);
  //   }
  // };

  // const handleCustomTimeToggle = async (enabled: boolean) => {
  //   if (!user || !item?.id || loadingNotification) return;
  //   setShowCustomTime(enabled);
  //   const newTiming = enabled
  //     ? [...notificationTiming.filter(t => !t.startsWith('custom:')), `custom:${customTime}`]
  //     : notificationTiming.filter(t => !t.startsWith('custom:'));
  //   setNotificationTiming(newTiming);
  //   setLoadingNotification(true);
  //   try {
  //     const { error } = await supabase
  //       .from('notification_settings')
  //       .upsert({
  //         user_id: user.id,
  //         watchlist_id: item.id,
  //         enabled: notificationEnabled,
  //         timing: newTiming,
  //         updated_at: new Date().toISOString(),
  //       }, {
  //         onConflict: 'user_id,watchlist_id'
  //       });
  //     if (error) {
  //       if (error.message?.includes('406') || String(error).includes('406')) {
  //         console.warn('通知タイミングの保存で406エラーが発生しました:', error);
  //       } else {
  //         throw error;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('カスタム時間の更新に失敗しました:', error);
  //     alert('カスタム時間の更新に失敗しました');
  //     setShowCustomTime(!enabled);
  //     setNotificationTiming(notificationTiming);
  //   } finally {
  //     setLoadingNotification(false);
  //   }
  // };

  const loadAnimeDetail = async () => {
    const anilistId = item?.anilist_id || animeMedia?.id;
    if (!anilistId) return;
    
    setLoading(true);
    try {
      const detail = await getAnimeDetail(anilistId);
      if (detail) {
        setAnimeDetail(detail);
        
        // AniListから放送情報を取得して初期値に設定
        const broadcastInfo = getBroadcastInfo(detail);
        if (broadcastInfo.day !== null && broadcastInfo.time) {
          // itemがある場合は、まだ設定されていない場合のみ設定
          if (item && !item.broadcast_day && !item.broadcast_time) {
            setBroadcastDay(broadcastInfo.day);
            setBroadcastTime(broadcastInfo.time);
          } else if (!item) {
            // itemがない場合（animeMediaから直接表示する場合）は常に設定
            setBroadcastDay(broadcastInfo.day);
            setBroadcastTime(broadcastInfo.time);
          }
        }
      }
    } catch (error) {
      console.error('アニメ詳細情報の取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'planned' | 'watching' | 'completed') => {
    if (!item?.anilist_id) return;
    
    try {
      const success = await storage.updateWatchlistItem(item.anilist_id, {
        status: newStatus,
      });
      
      if (success) {
        onUpdate?.();
      } else {
        alert('ステータスの更新に失敗しました');
      }
    } catch (error) {
      console.error('ステータスの更新に失敗しました:', error);
      alert('ステータスの更新に失敗しました');
    }
  };

  const handleSaveBroadcast = async () => {
    if (!item?.anilist_id) return;
    
    try {
      const success = await storage.updateWatchlistItem(item.anilist_id, {
        broadcast_day: broadcastDay,
        broadcast_time: broadcastTime || null,
      });
      
      if (success) {
        setEditingBroadcast(false);
        onUpdate?.();
      } else {
        alert('放送情報の更新に失敗しました');
      }
    } catch (error) {
      console.error('放送情報の更新に失敗しました:', error);
      alert('放送情報の更新に失敗しました');
    }
  };

  const getStatusLabel = (status: string | null | undefined) => {
    switch (status) {
      case 'planned': return '視聴予定';
      case 'watching': return '視聴中';
      case 'completed': return '視聴完了';
      default: return '未設定';
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'planned': return 'bg-blue-500';
      case 'watching': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // itemもanimeMediaもない場合は表示しない
  if (!item && !animeMedia) return null;

  // Annictから取得した日本語あらすじを優先
  const annictSynopsis = (animeMedia as AniListMediaWithStreaming)?.synopsisJa || null;
  const anilistDescription = animeDetail?.description 
    ? animeDetail.description.replace(/<[^>]*>/g, '') // HTMLタグを除去
    : null;
  
  // 表示するあらすじを決定（Annict優先、次にAniList）
  const description = annictSynopsis || anilistDescription;
  const isJapaneseDescription = annictSynopsis ? true : (anilistDescription ? hasJapaneseCharacters(anilistDescription) : false);
  const shouldTruncateDescription = description && description.length > 200;
  const displayDescription = expandedDescription || !shouldTruncateDescription
    ? description
    : description?.substring(0, 200) + '...';
  
  // Annictから取得した放送情報を優先
  const annictBroadcastTime = (animeMedia as AniListMediaWithStreaming)?.broadcastTime || null;

  // 配信サイトのフィルタリング（日本向けサービスを優先）
  const streamingSites = animeDetail?.externalLinks?.filter(link => {
    const site = link.site?.toLowerCase() || '';
    return site.includes('netflix') || 
           site.includes('amazon') || 
           site.includes('hulu') || 
           site.includes('disney') ||
           site.includes('abema') ||
           site.includes('dアニメ') ||
           site.includes('unext') ||
           site.includes('fod') ||
           site.includes('telasa') ||
           site.includes('bandai');
  }) || [];

  return (
    <>
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* ボトムシート */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* ドラッグハンドル */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* ヘッダー */}
        <div className="px-6 pb-4 border-b dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {displayTitle}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="閉じる"
            >
              <span className="text-2xl leading-none">×</span>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#e879d4] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">読み込み中...</p>
              </div>
            </div>
          ) : (
            <>
              {/* 積みアニメモード: 視聴済みにするボタン */}
              {item && isWatchlistMode && onMarkAsWatched && (
                <section>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    アクション
                  </h3>
                  <button
                    onClick={() => {
                      onMarkAsWatched(item);
                      onClose();
                    }}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                  >
                    視聴済みにする
                  </button>
                </section>
              )}

              {/* 来期視聴アニメモード: ステータス変更 */}
              {item && !isWatchlistMode && (
                <section>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    視聴ステータス
                  </h3>
                  <div className="flex gap-2">
                    {[
                      { status: 'planned' as const, label: '視聴予定', color: 'bg-blue-500' },
                      { status: 'watching' as const, label: '視聴中', color: 'bg-yellow-500' },
                      { status: 'completed' as const, label: '視聴完了', color: 'bg-green-500' },
                    ].map((statusOption) => (
                      <button
                        key={statusOption.status}
                        onClick={() => handleStatusChange(statusOption.status)}
                        disabled={item.status === statusOption.status}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          item.status === statusOption.status
                            ? `${statusOption.color} text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-400`
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        } disabled:opacity-100 disabled:cursor-default`}
                      >
                        {statusOption.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* あらすじ - 日本語優先 */}
              {description && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    あらすじ
                  </h3>
                  {annictSynopsis && (animeMedia as AniListMediaWithStreaming)?.synopsisSource && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      出典: {(animeMedia as AniListMediaWithStreaming).synopsisSource}
                    </p>
                  )}
                  {!isJapaneseDescription && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      ※日本語版がないため英語で表示しています
                    </p>
                  )}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {displayDescription}
                  </p>
                  {shouldTruncateDescription && (
                    <button
                      onClick={() => setExpandedDescription(!expandedDescription)}
                      className="mt-2 text-sm text-[#e879d4] hover:text-[#f09fe3] transition-colors"
                    >
                      {expandedDescription ? '折りたたむ' : 'もっと見る'}
                    </button>
                  )}
                </section>
              )}

              {/* 放送曜日・時間 - Annict優先 */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    放送曜日・時間
                  </h3>
                  {!editingBroadcast && item && (
                    <button
                      onClick={() => setEditingBroadcast(true)}
                      className="text-sm text-[#e879d4] hover:text-[#f09fe3] transition-colors"
                    >
                      編集
                    </button>
                  )}
                </div>
                {editingBroadcast ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        曜日
                      </label>
                      <select
                        value={broadcastDay ?? ''}
                        onChange={(e) => setBroadcastDay(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">選択してください</option>
                        {dayNames.map((day, index) => (
                          <option key={index} value={index}>
                            {day}曜日
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        時間
                      </label>
                      <input
                        type="time"
                        value={broadcastTime}
                        onChange={(e) => setBroadcastTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingBroadcast(false);
                          if (item) {
                            setBroadcastDay(item.broadcast_day ?? null);
                            setBroadcastTime(item.broadcast_time || '');
                          }
                        }}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={handleSaveBroadcast}
                        className="flex-1 px-4 py-2 bg-[#e879d4] text-white rounded-lg hover:bg-[#f09fe3] transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {annictBroadcastTime 
                      ? annictBroadcastTime
                      : (broadcastDay !== null && broadcastDay !== undefined && broadcastTime
                        ? `${dayNames[broadcastDay]} ${broadcastTime}`
                        : '未設定')}
                  </p>
                )}
              </section>

              {/* 通知設定 - 将来の実装用にコメントアウト */}

              {/* 配信サイト - Annict優先 */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    配信サイト
                  </h3>
                  {currentItem && (
                    <StreamingUpdateButton
                      onUpdate={async () => {
                        if (!currentItem?.id || !currentItem?.title) return;
                        const result = await updateWatchlistStreamingInfo(currentItem.id, currentItem.title);
                        if (result.success && result.streamingSites) {
                          // ローカルストレージまたはSupabaseから更新されたデータを取得
                          if (user) {
                            // Supabaseの場合、onUpdateを呼び出してデータを再取得
                            onUpdate?.();
                          } else {
                            // ローカルストレージの場合、直接状態を更新
                            const updatedAt = new Date().toISOString();
                            setCurrentItem({
                              ...currentItem,
                              streaming_sites: result.streamingSites,
                              streaming_updated_at: updatedAt,
                            });
                            // ローカルストレージも更新
                            if (currentItem.id && storage instanceof (await import('../../lib/storage/localStorageService')).LocalStorageService) {
                              // TypeScriptの型チェックを回避するため、anyでキャスト
                              (storage as any).updateStreamingInfo(currentItem.id, result.streamingSites);
                            } else if (currentItem.anilist_id) {
                              await storage.updateWatchlistItem(currentItem.anilist_id, {
                                streaming_sites: result.streamingSites,
                              });
                            }
                          }
                        } else if (result.error) {
                          throw new Error(result.error);
                        }
                      }}
                      lastUpdated={currentItem?.streaming_updated_at}
                      size="sm"
                    />
                  )}
                </div>
                {(() => {
                  // Annictから取得した配信情報を優先
                  const annictStreamingServices = (animeMedia as AniListMediaWithStreaming)?.streamingServices || [];
                  const itemStreamingSites = currentItem?.streaming_sites || [];
                  
                  // 優先順位: Annict > item > AniList
                  const displayStreamingServices = annictStreamingServices.length > 0 
                    ? annictStreamingServices 
                    : (itemStreamingSites.length > 0 
                      ? itemStreamingSites 
                      : streamingSites.map(link => link.site));
                  
                  return displayStreamingServices.length > 0 ? (
                    <StreamingBadges services={displayStreamingServices} size="md" maxDisplay={999} />
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      配信情報がありません
                    </p>
                  );
                })()}
                {streamingSites.length > 0 && (animeMedia as AniListMediaWithStreaming)?.streamingServices?.length === 0 && !currentItem?.streaming_sites && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    ※ AniListの情報は海外データベースのため、日本の配信情報が不完全な場合があります
                  </p>
                )}
              </section>

              {/* 話数 */}
              {animeDetail?.episodes && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    話数
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {animeDetail.episodes}話
                  </p>
                </section>
              )}

              {/* 制作スタジオ */}
              {animeDetail?.studios?.nodes && animeDetail.studios.nodes.length > 0 && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    制作スタジオ
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {animeDetail.studios.nodes.map((studio, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                      >
                        {studio.name}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* 原作 */}
              {animeDetail?.source && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    原作
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {animeDetail.source}
                  </p>
                </section>
              )}

              {/* 公式サイトリンク */}
              {(() => {
                const officialSiteUrl = animeDetail 
                  ? getOfficialSiteUrl(animeDetail)
                  : (animeMedia ? getOfficialSiteUrl(animeMedia as AniListMedia) : null);
                return officialSiteUrl ? (
                  <section>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                      公式サイト
                    </h3>
                    <a
                      href={officialSiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      公式サイト
                    </a>
                  </section>
                ) : null;
              })()}

              {/* 予告編 */}
              {animeDetail?.trailer?.id && animeDetail.trailer.site === 'youtube' && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    予告編
                  </h3>
                  <a
                    href={`https://www.youtube.com/watch?v=${animeDetail.trailer.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-center"
                  >
                    YouTubeで見る
                  </a>
                </section>
              )}

            </>
          )}
        </div>
      </div>
    </>
  );
}

