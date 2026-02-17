# 今期・来期視聴予定の改善 設計書

## 1. 概要

今期・来期視聴予定タブで以下を改善する。

1. **削除・取り消し**: 追加したアニメを「やっぱりやめる」で視聴予定から外せるようにする。
2. **評価の動線**: 視聴予定アニメから「視聴済みにする」→ 評価・クール選択 → 視聴履歴に追加、の流れを用意する。

---

## 2. 現状

- **追加**: 「今期/来期アニメから追加」で検索し、「視聴予定に追加」で watchlist に登録できる。追加後はボタンが「追加済み」になり操作はない。
- **一覧**: カードタップで詳細シートが開く。詳細では「視聴ステータス」（視聴予定/視聴中/視聴完了）の切り替えのみ。編集モードで複数選択→一括削除はあるが、単体の「リストから外す」はない。
- **評価**: 今期・来期の詳細シートには「視聴済みにする」ボタンがなく、評価を付けて視聴履歴（animes）に移す動線がない。

---

## 3. 方針

### 3.1 削除・取り消し

| 場所 | 変更内容 |
|------|----------|
| **検索結果カード**（今期/来期アニメから追加の一覧） | 「追加済み」のとき「視聴予定から外す」ボタンを表示。押下で `removeFromWatchlist(anilistId)` を実行し、一覧を再取得する。 |
| **詳細シート**（WatchlistDetailSheet） | 今期・来期モード（`!isWatchlistMode`）のとき「リストから削除」ボタンを表示。optional の `onRemove?: (anilistId: number) => void` を渡し、押下で削除→シートを閉じる。 |

- 既存の「編集」モードによる一括削除はそのまま残す。

### 3.2 評価の動線

- **詳細シート**で、今期・来期から開いた場合も「視聴済みにする」を表示する。
  - 条件: `item && onMarkAsWatched` が true のとき表示（積みアニメと共通）。
- **SeasonWatchlistTab** で以下を実装する:
  - `useAnimeDataContext()` と `useAuth()` で seasons / setSeasons / user を取得。
  - 「視聴済みにする」用のモーダル state（表示、選択中の item、評価、クール）。
  - ハンドラ: 視聴済みモーダルで「視聴済みにする」押下時、WatchlistTab と同様に animes に insert（評価・クールを反映）し、`removeFromWatchlist(anilistId)` で watchlist から削除。`setSeasons` でローカル state も更新。
- **WatchlistDetailSheet** の「視聴済みにする」表示条件を、積みアニメ専用から「`onMarkAsWatched` が渡されていれば表示」に変更し、今期・来期からも同じボタンでモーダルを開けるようにする。

---

## 4. データ・API

- 既存の `storage.removeFromWatchlist(anilistId)` をそのまま利用。
- 視聴済み追加は WatchlistTab と同様: `animeToSupabase`, `getSeasonName`, `supabase.from('animes').insert`, その後 `storage.removeFromWatchlist(anilist_id)`。

---

## 5. 実装タスク一覧

1. **検索結果カード**: 「追加済み」時に「視聴予定から外す」ボタン追加。`onRemove` コールバックで削除とリスト再読み込み。
2. **WatchlistDetailSheet**: `onRemove?: (anilistId: number) => void` を props に追加。`item && onRemove` のとき「リストから削除」を表示。削除後 `onClose` を呼ぶ。
3. **WatchlistDetailSheet**: 「視聴済みにする」の表示条件を `item && onMarkAsWatched` に変更（`isWatchlistMode` を外す）。
4. **SeasonWatchlistTab**: 視聴済みモーダル用 state と、評価・クール選択付きの「視聴済みにする」処理を実装。WatchlistDetailSheet に `onMarkAsWatched` と `onRemove` を渡す。

以上で、追加の取り消し・リストからの削除・評価付き視聴済みの動線が一通り揃う。
