'use client';

import { useRef, useState } from 'react';
import { useAnimeDataContext } from '../../../contexts/AnimeDataContext';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { getStorageService } from '../../../lib/storage';
import { getSession } from '../../../lib/api/auth';
import { getAnimesByUser } from '../../../lib/api/animes';
import { supabaseToAnime } from '../../../utils/helpers';
import type { Season } from '../../../types';
import { downloadText, recordsToCsv, recordsToJson } from '../../../lib/records/export';

export function RecordExportSection() {
  const { user, isLoading } = useAuth();
  const { isAnimeDataReady, loadError } = useAnimeDataContext();
  const { showToast } = useFeedback();
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function exportRecords(format: 'json' | 'csv') {
    if (lock.current || isLoading || !isAnimeDataReady || loadError) return;
    lock.current = true;
    setBusy(true);
    try {
      const [rows, animeRows] = await Promise.all([
        getStorageService(!!user).getWatchlist(),
        user ? getAnimesByUser(user.id) : Promise.resolve(null),
      ]);
      const session = await getSession();
      if ((session?.user.id ?? null) !== (user?.id ?? null))
        throw new Error('ログイン状態が変わりました。もう一度お試しください。');
      let seasons: Season[];
      if (animeRows) {
        const grouped = new Map<string, Season>();
        for (const row of animeRows) {
          const name = row.season_name || '未分類';
          if (!grouped.has(name)) grouped.set(name, { name, animes: [] });
          grouped.get(name)!.animes.push(supabaseToAnime(row));
        }
        seasons = [...grouped.values()];
      } else {
        // 認証の切替直後に画面の古いアカウントデータを書き出さない。
        const stored: unknown = JSON.parse(localStorage.getItem('animeSeasons') ?? '[]');
        if (
          !Array.isArray(stored) ||
          stored.some(
            (value) => !value || typeof value.name !== 'string' || !Array.isArray(value.animes)
          )
        ) {
          throw new Error('端末の記録を読み取れませんでした。保存データは変更していません。');
        }
        seasons = stored;
      }
      const date = new Date().toISOString().slice(0, 10);
      downloadText(
        format === 'json' ? recordsToJson(seasons, rows) : recordsToCsv(seasons, rows),
        `animelog-records-${date}.${format}`,
        format === 'json' ? 'application/json' : 'text/csv;charset=utf-8'
      );
      showToast('記録を書き出しました');
    } catch (error) {
      showToast(error instanceof Error ? error.message : '書き出しに失敗しました', 'error');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <section className="rounded-2xl bg-white dark:bg-gray-800 p-5 space-y-3">
      <h2 className="font-bold text-lg dark:text-white">記録の保存と書き出し</h2>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        {isLoading
          ? '保存先を確認中…'
          : user
            ? '視聴記録と視聴予定の保存先：アカウント'
            : '視聴記録と視聴予定の保存先：このブラウザ'}
      </p>
      {!isLoading && !user && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          ブラウザのデータを消すと記録も消えます。ログイン後の記録とは自動で統合されません。
        </p>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-300">
        視聴記録と視聴予定をファイルに保存できます。JSONは記録の詳細、CSVは一覧です。公開レビュー・プロフィール・推しキャラは対象外です。JSONの復元・引き継ぎは下の「記録の復元・引き継ぎ」から操作できます。
      </p>
      <div className="flex flex-wrap gap-3">
        {(['json', 'csv'] as const).map((format) => (
          <button
            key={format}
            type="button"
            onClick={() => void exportRecords(format)}
            disabled={busy || isLoading || !isAnimeDataReady || loadError}
            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-800 dark:text-white disabled:opacity-40"
          >
            {format.toUpperCase()}を書き出す
          </button>
        ))}
      </div>
    </section>
  );
}
