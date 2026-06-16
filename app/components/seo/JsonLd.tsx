/**
 * JSON-LD を <script type="application/ld+json"> としてSSR出力するサーバコンポーネント。
 * 'use client' を付けないことでサーバ描画され、JSを実行しないクローラ/AIにも確実に届く。
 */

type JsonLdProps = {
  /** 1件のオブジェクト or 複数（複数なら個別の<script>として出力） */
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          // 値はサーバ側で生成した固定の構造化データのみ。
          // `<` をエスケープして </script> によるbreak-outを防ぐ（Next.js公式の推奨形式）。
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
