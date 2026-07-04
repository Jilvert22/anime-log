# delete-account API レート制限テストガイド

## 📋 レート制限の仕組み

### 実装内容
- **最大試行回数**: 3回（`maxAttempts: 3`）
- **時間ウィンドウ**: 1時間（`windowMs: 60 * 60 * 1000`）
- **動作方式**: インメモリ（サーバー再起動でリセット）

### 動作フロー

1. **1回目のリクエスト**
   - レコードが存在しない → 新規作成（count: 1）
   - `checkRateLimit()` は `true` を返す
   - リクエストは処理される（認証エラーやその他のエラーが発生する可能性があるが、レート制限は発動しない）

2. **2回目のリクエスト**
   - 既存レコードの count をインクリメント（count: 2）
   - `checkRateLimit()` は `true` を返す
   - リクエストは処理される

3. **3回目のリクエスト**
   - 既存レコードの count をインクリメント（count: 3）
   - `checkRateLimit()` は `true` を返す（count < maxAttempts ではないが、インクリメント前にチェックされるため）
   - 実際には、count が 3 になった時点で次回のリクエストから制限される

4. **4回目以降のリクエスト**
   - `record.count >= RATE_LIMIT.maxAttempts` (3) なので `false` を返す
   - **429ステータスコード**が返される ✅

---

## 🧪 テストコード

### ブラウザの開発者ツール（Console）で実行

```javascript
async function testRateLimit() {
  console.log('=== delete-account API レート制限テスト開始 ===');
  console.log('注意: ログイン状態で実行してください\n');
  
  for (let i = 1; i <= 5; i++) {
    try {
      const res = await fetch('/api/delete-account', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // クッキーを送信
      });
      
      const status = res.status;
      const data = await res.json().catch(() => ({}));
      
      if (status === 429) {
        console.log(`✅ ${i}回目: ${status} (${data.error || 'レート制限発動！'})`);
      } else if (status === 401) {
        console.log(`⚠️  ${i}回目: ${status} (認証エラー - ログインが必要です)`);
      } else if (status === 200 || status === 500) {
        console.log(`⚠️  ${i}回目: ${status} (レート制限チェックは通過しました)`);
        if (status === 200) {
          console.log('   ⚠️  実際にアカウントが削除された可能性があります！');
        }
      } else {
        console.log(`${i}回目: ${status}`);
      }
      
      // 少し待機（連続リクエストを避ける）
      if (i < 5) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`${i}回目: エラー -`, error);
    }
  }
  
  console.log('\n=== テスト完了 ===');
  console.log('期待される結果: 4回目以降に429ステータスが返される');
}

testRateLimit();
```

---

## 📊 期待される結果

### 正常な動作パターン

**ログイン済みの場合**:
- 1回目: `200` または `500`（レート制限は通過、削除処理が実行されるかエラーが発生）
- 2回目: `200` または `500`
- 3回目: `200` または `500`
- 4回目: `429` ✅ **レート制限発動**
- 5回目: `429` ✅ **レート制限発動**

**未ログインの場合**:
- 1〜5回目すべて: `401`（認証エラー - レート制限チェックの前に認証チェックで失敗）

---

## ⚠️ 重要な注意事項

1. **実際の削除が実行される可能性**
   - レート制限チェックは認証チェック**後**に実行されます
   - 1〜3回目のリクエストは実際にアカウント削除処理が実行される可能性があります
   - **テスト用のアカウントで実行することを強く推奨します**

2. **サーバー再起動でリセット**
   - インメモリ方式のため、開発サーバーを再起動するとレート制限カウンターがリセットされます

3. **本番環境での注意**
   - 複数のインスタンスが存在する場合、インスタンス間でレート制限が共有されません
   - Vercel KVやUpstash Redisの使用を推奨

---

## 🔍 トラブルシューティング

### 429が返されない場合

1. **サーバーが再起動されている**
   - 開発サーバーを再起動するとカウンターがリセットされます
   - 再度テストを実行してください

2. **異なるユーザーでログインしている**
   - レート制限はユーザーID単位で管理されます
   - 同じユーザーでテストしているか確認してください

3. **認証エラー（401）が発生している**
   - レート制限チェックは認証チェックの後に実行されます
   - ログイン状態を確認してください

---

## 📝 実装の詳細

### レート制限チェックのタイミング

```typescript
// 認証チェック（401エラーが返される可能性）
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
}

// レート制限チェック（429エラーが返される可能性）
if (!checkRateLimit(userId)) {
  return NextResponse.json(
    { error: 'リクエストが多すぎます。しばらく時間をおいてから再度お試しください。' },
    { status: 429 }
  );
}

// アカウント削除処理（ここまで到達すると実際に削除される）
```

---

**作成日**: 2025年
**テスト推奨**: 開発環境のテスト用アカウントで実行

