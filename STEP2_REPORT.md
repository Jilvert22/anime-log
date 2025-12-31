# Step 2: useAnimeDataの整理 - 完了レポート

## Phase 1: 二重管理の解消

### 問題の確認
- `HomeClient.tsx`内で直接定義（49行目）→ `HomeTab`で使用
- `useAnimeData`から取得（`oldExpandedSeasons`としてリネーム）→ `AddAnimeFormModal`で使用
- **状態の同期が取れていない問題あり**

### 解決方法
**統一先: `useAnimeData`**

理由：
- `useAnimeData`内で`expandedSeasons`を管理している
- データ読み込み時に最初のシーズンを自動展開する機能がある（15-19行目、61行目、92行目）
- アニメデータと展開状態の関連性が高い

### 実施した変更

#### 1. `HomeClient.tsx`の直接定義を削除
```typescript
// 削除
const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
```

#### 2. `useAnimeData`から取得した状態を使用
```typescript
// 変更前
expandedSeasons: oldExpandedSeasons,
setExpandedSeasons: setOldExpandedSeasons,

// 変更後
expandedSeasons,
setExpandedSeasons,
```

#### 3. `HomeTab`への参照を修正
- 既に`expandedSeasons`として渡されていたため、変更不要

#### 4. `AddAnimeFormModal`への参照を修正
```typescript
// 変更前
expandedSeasons={oldExpandedSeasons}
setExpandedSeasons={setOldExpandedSeasons}

// 変更後
expandedSeasons={expandedSeasons}
setExpandedSeasons={setExpandedSeasons}
```

### 削除したコード
- `HomeClient.tsx` 49行目: `const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());`
- `HomeClient.tsx` 119-120行目: `expandedSeasons: oldExpandedSeasons, setExpandedSeasons: setOldExpandedSeasons,` のリネーム

---

## Phase 2: useAnimeDataの責務確認

### 行数: **138行**

### 責務一覧

#### 責務1: データ読み込み
- **行数**: 33-108行目（約75行）
- **内容**:
  - Supabaseからのデータ読み込み（`loadFromSupabase`）
  - localStorageからのデータ読み込み（`loadFromLocalStorage`）
  - データ読み込みのトリガー管理（`useEffect`）
  - サンプルデータの検出と削除

#### 責務2: localStorage管理（未ログイン時の永続化）
- **行数**: 22-30行目（約8行）
- **内容**:
  - 未ログイン時にアニメデータをlocalStorageに保存
  - 重複保存の防止（`prevSeasonsRef`を使用）

#### 責務3: 展開状態管理
- **行数**: 11行目、14-19行目（約6行）
- **内容**:
  - `expandedSeasons`状態の管理
  - 最初のシーズンの自動展開（`expandFirstSeason`）
  - データ読み込み時の自動展開

#### 責務4: 統計計算
- **行数**: 110-127行目（約18行）
- **内容**:
  - すべてのアニメの取得（`allAnimes`）
  - 平均評価の計算（`averageRating`）
  - 累計周回数の計算（`totalRewatchCount`）

#### 責務5: 状態の公開
- **行数**: 129-137行目（約8行）
- **内容**:
  - 返り値の定義
  - `seasons`, `setSeasons`, `expandedSeasons`, `setExpandedSeasons` などの公開

### 責務数: **5個**

---

## Phase 3: 分割判断

### 判断基準
- **責務が3つ以上** ✅（5個）
- **行数が100行以上** ✅（138行）

### 分割の必要性

#### ❌ **分割不要** - 現状維持を推奨

**理由:**

1. **関連性が高い**
   - データ読み込みとlocalStorage管理は密接に関連
   - 展開状態はデータ読み込み時に初期化される（61行目、92行目）
   - 統計計算は読み込んだデータに基づく

2. **分割すると複雑になる**
   - `useAnimeDataLoader` + `useAnimeStatistics` + `useSeasonExpansion` に分割すると：
     - 状態の共有が必要になる
     - 依存関係が複雑になる
     - フック間のデータ同期が必要になる

3. **現在のサイズは適切**
   - 138行は管理可能な範囲
   - 各責務が明確に分離されている
   - 可読性は高い

4. **単一の責任がある**
   - 「アニメデータの全体的な管理」という1つの大きな責任
   - データ読み込み、永続化、展開状態、統計はすべて「アニメデータ管理」の一部

### 改善提案（将来の検討事項）

もし将来的にさらに複雑になる場合は：

1. **統計計算のみ分離**
   - `useAnimeStatistics.ts` を作成
   - `allAnimes`を入力として受け取り、統計を計算
   - 最も独立している責務

2. **展開状態のみ分離**
   - `useSeasonExpansion.ts` を作成
   - ただし、データ読み込み時の自動展開との関連性が高いため、分離は慎重に

3. **現状維持**
   - 現在のままで十分機能している
   - 無理な分割は避ける

---

## 最終報告

```
二重管理の解消: 完了 ✅
統一先: useAnimeData
削除したコード: HomeClient.tsx内のexpandedSeasons直接定義（1行）、リネーム（2行）
残った責務: 5個（データ読み込み、localStorage管理、展開状態管理、統計計算、状態の公開）
行数: 138行
分割の必要性: なし（関連性が高く、分割すると複雑になる）
ビルド結果: 成功 ✅
```

---

## 改善点

### ✅ 達成したこと
1. `expandedSeasons`の二重管理を解消
2. 状態の同期問題を解決
3. コードの簡素化と保守性の向上
4. `useAnimeData`が展開状態の唯一のソースになった

### 📝 今後の検討事項
- 将来的に統計計算がさらに複雑になった場合、`useAnimeStatistics`への分離を検討
- ただし、現時点では分割不要

---

## 次のステップ

Step 2は完了しました。`expandedSeasons`の二重管理が解消され、`useAnimeData`が整理されました。

次のステップ（Step 3以降）に進む準備ができています。

