#!/usr/bin/env node

/**
 * 生成されたService Workerにプッシュ通知のコードを注入するスクリプト
 * ビルド後に実行されることを想定
 */

const fs = require('fs');
const path = require('path');

const swPath = path.join(__dirname, '../public/sw.js');
const pushNotificationCode = `
// プッシュ通知の受信処理（自動注入）
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

// 通知クリック時の処理（自動注入）
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
`;

try {
  if (!fs.existsSync(swPath)) {
    console.warn('Service Workerファイルが見つかりません:', swPath);
    console.warn('ビルドを実行してください: npm run build');
    process.exit(0);
  }

  let swContent = fs.readFileSync(swPath, 'utf8');

  // 既に注入されているか確認
  if (swContent.includes('プッシュ通知の受信処理（自動注入）')) {
    console.log('プッシュ通知のコードは既に注入されています。');
    process.exit(0);
  }

  // Service Workerの最後にプッシュ通知のコードを追加
  swContent += pushNotificationCode;

  fs.writeFileSync(swPath, swContent, 'utf8');
  console.log('✅ プッシュ通知のコードをService Workerに注入しました。');
} catch (error) {
  console.error('❌ エラーが発生しました:', error);
  process.exit(1);
}

