'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getAnimeDetail, getBroadcastInfo, type AniListMedia } from '../../lib/anilist';
import type { WatchlistItem } from '../../lib/storage/types';
import { useStorage } from '../../hooks/useStorage';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from '../../lib/push-notifications';

interface WatchlistDetailSheetProps {
  item?: WatchlistItem | null;
  animeMedia?: AniListMedia | null;
  onClose: () => void;
  onUpdate?: () => void;
}

export function WatchlistDetailSheet({ item, animeMedia, onClose, onUpdate }: WatchlistDetailSheetProps) {
  const [animeDetail, setAnimeDetail] = useState<AniListMedia | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(false);
  const [broadcastDay, setBroadcastDay] = useState<number | null>(null);
  const [broadcastTime, setBroadcastTime] = useState<string>('');
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [notificationTiming, setNotificationTiming] = useState<string[]>(['1hour']);
  const [loadingNotification, setLoadingNotification] = useState(false);
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
      loadNotificationSettings();
    }
  }, [item]);

  const loadNotificationSettings = async () => {
    if (!user || !item?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('enabled, timing')
        .eq('user_id', user.id)
        .eq('watchlist_id', item.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116はレコードが見つからないエラー
        console.error('通知設定の取得に失敗しました:', error);
        return;
      }
      
      if (data) {
        setNotificationEnabled(data.enabled);
        setNotificationTiming(data.timing || ['1hour']);
      } else {
        setNotificationEnabled(false);
        setNotificationTiming(['1hour']);
      }
    } catch (error) {
      console.error('通知設定の取得に失敗しました:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!user || !item?.id) return;
    
    setLoadingNotification(true);
    try {
      if (enabled) {
        // プッシュ通知に購読
        try {
          await subscribeToPushNotifications(user);
        } catch (error) {
          console.error('プッシュ通知の購読に失敗しました:', error);
          // 購読に失敗しても通知設定は保存する（後で再試行可能）
        }
      } else {
        // プッシュ通知の購読を解除
        try {
          await unsubscribeFromPushNotifications(user);
        } catch (error) {
          console.error('プッシュ通知の購読解除に失敗しました:', error);
          // 購読解除に失敗しても通知設定は保存する
        }
      }
      
      // 通知設定をSupabaseに保存
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          watchlist_id: item.id,
          enabled,
          timing: notificationTiming,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,watchlist_id'
        });
      
      if (error) throw error;
      
      setNotificationEnabled(enabled);
    } catch (error) {
      console.error('通知設定の更新に失敗しました:', error);
      alert('通知設定の更新に失敗しました');
    } finally {
      setLoadingNotification(false);
    }
  };

  const handleTimingChange = async (timing: string) => {
    if (!user || !item?.id) return;
    
    const newTiming = notificationTiming.includes(timing)
      ? notificationTiming.filter(t => t !== timing)
      : [...notificationTiming, timing];
    
    setLoadingNotification(true);
    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          watchlist_id: item.id,
          enabled: notificationEnabled,
          timing: newTiming,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,watchlist_id'
        });
      
      if (error) throw error;
      
      setNotificationTiming(newTiming);
    } catch (error) {
      console.error('通知タイミングの更新に失敗しました:', error);
      alert('通知タイミングの更新に失敗しました');
    } finally {
      setLoadingNotification(false);
    }
  };

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

  // itemもanimeMediaもない場合は表示しない
  if (!item && !animeMedia) return null;

  const description = animeDetail?.description 
    ? animeDetail.description.replace(/<[^>]*>/g, '') // HTMLタグを除去
    : null;
  const shouldTruncateDescription = description && description.length > 200;
  const displayDescription = expandedDescription || !shouldTruncateDescription
    ? description
    : description?.substring(0, 200) + '...';

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
              {/* あらすじ */}
              {description && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    あらすじ
                  </h3>
                  {!hasJapaneseCharacters(description) && (
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

              {/* 放送曜日・時間 */}
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
                    {broadcastDay !== null && broadcastDay !== undefined && broadcastTime
                      ? `${dayNames[broadcastDay]} ${broadcastTime}`
                      : '未設定'}
                  </p>
                )}
              </section>

              {/* 通知設定 */}
              {user && item && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    通知設定
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        通知を有効にする
                      </label>
                      <button
                        onClick={() => handleNotificationToggle(!notificationEnabled)}
                        disabled={loadingNotification}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          notificationEnabled ? 'bg-[#e879d4]' : 'bg-gray-300 dark:bg-gray-600'
                        } ${loadingNotification ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    {notificationEnabled && (
                      <div className="space-y-2 pl-2 border-l-2 border-[#e879d4]">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          通知タイミング（複数選択可）
                        </p>
                        {[
                          { value: '30min', label: '30分前' },
                          { value: '1hour', label: '1時間前' },
                          { value: '3hour', label: '3時間前' },
                          { value: 'morning', label: '当日朝（9:00）' },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={notificationTiming.includes(option.value)}
                              onChange={() => handleTimingChange(option.value)}
                              disabled={loadingNotification}
                              className="w-4 h-4 text-[#e879d4] border-gray-300 rounded focus:ring-[#e879d4] focus:ring-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      ※ iOSではホーム画面に追加すると通知が届きます
                    </p>
                  </div>
                </section>
              )}

              {/* 配信サイト */}
              <section>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                  配信サイト
                </h3>
                {streamingSites.length > 0 ? (
                  <div className="space-y-2">
                    {streamingSites.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {link.site}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {link.url}
                        </p>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    配信情報がありません
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  ※ AniListの情報は海外データベースのため、日本の配信情報が不完全な場合があります
                </p>
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

              {/* 平均スコア */}
              {animeDetail?.averageScore && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    平均スコア
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {animeDetail.averageScore} / 100
                  </p>
                </section>
              )}

              {/* 1話の長さ */}
              {animeDetail?.duration && (
                <section>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                    1話の長さ
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {animeDetail.duration}分
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

