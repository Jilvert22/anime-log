/**
 * プッシュ通知関連のユーティリティ関数
 */

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

/**
 * プッシュ通知購読情報の型
 */
export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Service Workerを登録/取得
 */
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    // Service Workerを登録（next-pwaが既に登録している場合は取得）
    const registration = await navigator.serviceWorker.ready;
    
    // プッシュ通知用のService Workerコードを追加登録
    // next-pwaが生成するService Workerの後に追加
    try {
      await navigator.serviceWorker.getRegistration();
      // プッシュ通知のイベントリスナーは既に登録されているはず
      // もし登録されていない場合は、追加のService Workerファイルをインポート
      // ただし、next-pwaが生成するService Worker内で直接処理する方が確実
    } catch (error) {
      console.warn('プッシュ通知用Service Workerの追加登録に失敗しました:', error);
    }
    
    return registration;
  } catch (error) {
    console.error('Service Workerの取得に失敗しました:', error);
    return null;
  }
}

/**
 * VAPID公開鍵を取得
 */
function getVapidPublicKey(): string {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!key) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEYが設定されていません');
  }
  return key;
}

/**
 * プッシュ通知に購読する
 * @param user 現在のユーザー
 * @returns 購読情報またはnull
 */
export async function subscribeToPushNotifications(
  user: User
): Promise<PushSubscription | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // 通知権限をリクエスト
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('通知権限が許可されていません');
      return null;
    }

    // Service Workerを取得
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('Service Workerが見つかりません');
    }

    // 既存の購読を確認
    let subscription = await registration.pushManager.getSubscription();

    // 購読が存在しない、またはVAPIDキーが変更された場合は新規購読
    const vapidPublicKey = getVapidPublicKey();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // 購読情報をSupabaseに保存
    const subscriptionData = subscription.toJSON();
    if (subscriptionData.keys) {
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint: subscriptionData.endpoint || '',
            p256dh: subscriptionData.keys.p256dh || '',
            auth: subscriptionData.keys.auth || '',
          },
          {
            onConflict: 'user_id,endpoint',
          }
        );

      if (error) {
        console.error('購読情報の保存に失敗しました:', error);
        throw error;
      }
    }

    return subscription;
  } catch (error) {
    console.error('プッシュ通知の購読に失敗しました:', error);
    throw error;
  }
}

/**
 * プッシュ通知の購読を解除する
 * @param user 現在のユーザー
 */
export async function unsubscribeFromPushNotifications(
  user: User
): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();

      // Supabaseから購読情報を削除
      if (subscription.endpoint) {
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) {
          console.error('購読情報の削除に失敗しました:', error);
        }
      }
    }
  } catch (error) {
    console.error('プッシュ通知の購読解除に失敗しました:', error);
    throw error;
  }
}

/**
 * 現在の購読状態を確認
 * @returns 購読中かどうか
 */
export async function isSubscribedToPushNotifications(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('購読状態の確認に失敗しました:', error);
    return false;
  }
}

/**
 * VAPID公開鍵をUint8Arrayに変換
 * @param base64String Base64エンコードされたVAPID公開鍵
 * @returns Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

