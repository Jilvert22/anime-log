'use client';

import { useState } from 'react';
import { track } from '@vercel/analytics';
import type { Season } from '../../../types';
import { buildRecap, recapYears } from '../../../lib/records/recap';
import { downloadText } from '../../../lib/records/export';
import { useFeedback } from '../../../contexts/FeedbackContext';

export function RecapPreview({ seasons }: { seasons: Season[] }) {
  const years = recapYears(seasons);
  const [selected, setSelected] = useState<number | null>(null);
  const [theme, setTheme] = useState<'pink' | 'night'>('pink');
  const [interested, setInterested] = useState(false);
  const { showToast } = useFeedback();
  const year = selected !== null && years.includes(selected) ? selected : years[0];
  const recap = year === undefined ? null : buildRecap(seasons, year);
  return (
    <section className="rounded-2xl bg-white dark:bg-gray-800 p-5 space-y-4">
      <h2 className="text-lg font-bold dark:text-white">年別の作品棚</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        登録したクールの年で振り返ります。実際に観た年とは異なる場合があります。
      </p>
      {!recap ? (
        <p className="text-sm dark:text-gray-300">
          年・クールを指定して作品を追加すると、ここに作品棚ができます。
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <label className="text-sm dark:text-white">
              年{' '}
              <select
                value={year}
                onChange={(event) => setSelected(Number(event.target.value))}
                className="rounded-lg border p-2 dark:bg-gray-900"
              >
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}年
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm dark:text-white">
              配色{' '}
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value as 'pink' | 'night')}
                className="rounded-lg border p-2 dark:bg-gray-900"
              >
                <option value="pink">さくら</option>
                <option value="night">夜空</option>
              </select>
            </label>
          </div>
          <div
            className={`rounded-2xl p-5 space-y-3 ${theme === 'night' ? 'bg-slate-900 text-white' : 'bg-rose-50 text-rose-950'}`}
          >
            <p className="text-sm">ANIMELOG / {year}</p>
            <h3 className="text-2xl font-bold">{recap.count}作品の思い出</h3>
            <p>平均評価 {recap.average === null ? '未評価' : `${recap.average.toFixed(1)} / 5`}</p>
            <p className="text-sm">高く評価した作品</p>
            {recap.favorites.length === 0 ? (
              <p>評価をつけると表示されます。</p>
            ) : (
              <ol className="space-y-2">
                {recap.favorites.map((anime) => (
                  <li key={anime.id} className="break-words">
                    ★{anime.rating}　{anime.title}
                  </li>
                ))}
              </ol>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              const text = `${year}年のクールに登録した作品棚\n${recap.count}作品\n${recap.favorites.map((anime) => `★${anime.rating} ${anime.title}`).join('\n')}\n\nアニメログ https://animelog.jp/`;
              downloadText(text, `animelog-shelf-${year}.txt`, 'text/plain;charset=utf-8');
            }}
            className="border rounded-xl px-4 py-3 dark:text-white"
          >
            作品棚をテキストで保存
          </button>
        </>
      )}
      <details className="border-t dark:border-gray-700 pt-3">
        <summary className="cursor-pointer text-sm text-fuchsia-800 dark:text-fuchsia-300 py-2">
          もっと楽しめる振り返りを検討しています
        </summary>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
          年ごとの比較、感想をまとめたアルバム、カードのデザイン編集など。追加機能の料金案は月額300円・年額2,400円です。現在は見本のため、購入や請求はありません。既存の無料機能は引き続き使えます。
        </p>
        <button
          type="button"
          disabled={interested}
          onClick={() => {
            try {
              track('premium_interest', { feature: 'recap', offer: 'monthly300_annual2400' });
            } catch {
              /* 解析失敗で操作を妨げない */
            }
            setInterested(true);
            showToast('ありがとうございます。検討の参考にします。');
          }}
          className="mt-3 px-4 py-3 rounded-xl border dark:text-white disabled:opacity-60"
        >
          {interested ? '興味ありを選択しました' : 'この追加機能に興味がある'}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          購入予約ではありません。利用可能な場合、機能への関心を匿名で集計します。作品名や感想は送信しません。
        </p>
      </details>
    </section>
  );
}
