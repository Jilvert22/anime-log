// カスタムService Worker（プッシュ通知対応）
// next-pwaのworkboxと統合

// workboxファイルをインポート（next-pwaが生成するworkboxファイルを使用）
// ビルド時に生成されるworkboxファイルを相対パスでインポート
// next-pwaは workbox-*.js という形式でファイルを生成します
// このファイルは、next-pwaのビルドプロセスで処理されます

// プッシュ通知の受信処理
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'アニメログ',
    body: '新しい通知があります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: '/',
    },
  };

  // 通知データが含まれている場合
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'アニメログ',
        body: data.body || '新しい通知があります',
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        data: {
          url: data.url || '/',
          ...data.data,
        },
      };
    } catch (error) {
      console.error('通知データの解析に失敗しました:', error);
    }
  }

  const promiseChain = self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    data: notificationData.data,
    tag: notificationData.data?.tag || 'anime-log-notification',
    requireInteraction: false,
  });

  event.waitUntil(promiseChain);
});

// 通知クリック時の処理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // 既に開いているウィンドウがあるか確認
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // 新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

