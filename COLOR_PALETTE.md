# アニメログ カラーパレット

## 定義場所
- `app/globals.css` の `:root` セクション

## メインカラーパレット

### プライマリカラー（ライトピンク）
```css
--color-primary: #e879d4;        /* メインのピンク */
--color-primary-light: #f09fe3;  /* ライトバリエーション */
--color-primary-dark: #d45dbf;    /* ダークバリエーション */
```

### セカンダリカラー（シアン）
```css
--color-secondary: #00d4ff;       /* メインのシアン */
--color-secondary-light: #33ddff; /* ライトバリエーション */
--color-secondary-dark: #00b8e0;   /* ダークバリエーション */
```

### アクセントカラー（ゴールド）
```css
--color-accent: #ffd700;           /* メインのゴールド */
--color-accent-light: #ffe44d;    /* ライトバリエーション */
```

### グラデーション用パープル
```css
--color-purple: #764ba2;           /* パープル */
```

## グラデーション

```css
--gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-purple));
--gradient-primary-reverse: linear-gradient(135deg, var(--color-purple), var(--color-primary));
```

## 背景色

### ライトモード
```css
--background: #ffffff;             /* 白 */
--foreground: #171717;             /* ほぼ黒 */
```

### ダークモード
```css
--background: #0a0a0f;            /* 濃い青黒 */
--foreground: #ffffff;            /* 白 */
```

## DNAカード用カラー（重複定義）

DNAカード用に同じカラーが別名で定義されています：

```css
--color-pink: #e879d4;            /* = --color-primary */
--color-pink-light: #f09fe3;      /* = --color-primary-light */
--color-pink-dark: #d45dbf;        /* = --color-primary-dark */

--color-cyan: #00d4ff;             /* = --color-secondary */
--color-cyan-light: #33ddff;       /* = --color-secondary-light */
--color-cyan-dark: #00b8e0;        /* = --color-secondary-dark */

--color-gold: #ffd700;             /* = --color-accent */
--color-gold-light: #ffe44d;       /* = --color-accent-light */
```

## カラーサンプル

### プライマリ（ピンク）
- メイン: `#e879d4` 🟣
- ライト: `#f09fe3` 🟣
- ダーク: `#d45dbf` 🟣

### セカンダリ（シアン）
- メイン: `#00d4ff` 🔵
- ライト: `#33ddff` 🔵
- ダーク: `#00b8e0` 🔵

### アクセント（ゴールド）
- メイン: `#ffd700` 🟡
- ライト: `#ffe44d` 🟡

### パープル
- `#764ba2` 🟣

