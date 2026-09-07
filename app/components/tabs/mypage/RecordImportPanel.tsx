'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnimeDataContext } from '../../../contexts/AnimeDataContext';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedback } from '../../../contexts/FeedbackContext';
import {
  MAX_IMPORT_BYTES,
  parseRecordFile,
  type RecordBundle,
} from '../../../lib/records/importValidation';
import {
  applyImport,
  createImportPreview,
  type ImportPreview,
} from '../../../lib/records/importWorkflow';
import { BEFORE_IMPORT_KEY, readGuestSnapshot } from '../../../lib/records/importStorage';
import { downloadText } from '../../../lib/records/export';

export function RecordImportPanel() {
  const { user, isLoading } = useAuth();
  const { saveError } = useAnimeDataContext();
  if (saveError)
    return (
      <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
        未保存の記録があります。画面上部から保存を再試行するか、未保存の記録を書き出してから復元してください。
      </p>
    );
  if (isLoading) return <p role="status">保存先を確認中…</p>;
  return (
    <ImportControls
      key={user?.id ?? 'guest'}
      ownerId={user?.id ?? null}
      accountLabel={user?.email ?? 'アカウント'}
    />
  );
}

function ImportControls({
  ownerId,
  accountLabel,
}: {
  ownerId: string | null;
  accountLabel: string;
}) {
  const { showToast } = useFeedback();
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [sourceLabel, setSourceLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function prepare(read: () => Promise<RecordBundle>, label: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setPreview(null);
    setMessage('');
    try {
      const next = await createImportPreview(await read(), ownerId);
      if (active.current) {
        setPreview(next);
        setSourceLabel(label);
      }
    } catch (error) {
      if (active.current)
        setMessage(error instanceof Error ? error.message : 'ファイルを読み込めませんでした');
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }
  async function restore() {
    if (!preview || lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const count = await applyImport(preview);
      if (active.current) {
        setPreview(null);
        showToast(`${count}件を追加しました。元のファイル・端末記録は残っています。`);
      }
    } catch (error) {
      if (active.current)
        setMessage(error instanceof Error ? error.message : '取り込めませんでした');
    } finally {
      lock.current = false;
      if (active.current) setBusy(false);
    }
  }
  function exportPrevious() {
    try {
      const previous = localStorage.getItem(BEFORE_IMPORT_KEY);
      if (!previous) {
        setMessage('このブラウザには復元前の控えがありません');
        return;
      }
      downloadText(previous, 'animelog-before-import.json', 'application/json');
    } catch {
      setMessage('復元前の控えを書き出せませんでした');
    }
  }
  return (
    <section
      aria-label="記録の取り込み"
      className="rounded-2xl bg-white dark:bg-gray-800 p-5 space-y-4"
    >
      <h2 className="font-bold text-lg dark:text-white">記録の復元・引き継ぎ</h2>
      <p className="text-sm text-gray-700 dark:text-gray-200 break-all">
        保存先：{ownerId ? accountLabel : 'このブラウザ'}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        アニメログで書き出したJSONを読み込み、新しい作品だけを追加します。既存の評価・メモ・話数は上書きしません。視聴記録と視聴予定が対象で、公開レビュー・プロフィール・推しキャラは含みません。
      </p>
      <label className="block text-sm text-gray-700 dark:text-gray-200">
        JSONファイルを選択（5MB・5000件まで）
        <input
          type="file"
          accept=".json,application/json"
          disabled={busy}
          className="block mt-2 w-full text-sm file:rounded-lg file:border file:border-gray-300 file:px-3 file:py-2 dark:file:bg-gray-900 dark:file:text-white"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            void prepare(async () => {
              if (file.size > MAX_IMPORT_BYTES) throw new Error('ファイルは5MB以下にしてください');
              return parseRecordFile(await file.text());
            }, file.name);
          }}
        />
      </label>
      {ownerId && (
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void prepare(async () => (await readGuestSnapshot()).bundle, 'このブラウザの記録')
          }
          className="rounded-xl border border-gray-300 px-4 py-3 text-sm dark:text-white disabled:opacity-40"
        >
          端末の記録をアカウントへ引き継ぐ
        </button>
      )}
      {busy && (
        <p role="status" className="text-sm dark:text-white">
          記録を確認・保存しています…
        </p>
      )}
      {message && (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
          {message}
        </p>
      )}
      {ownerId && (
        <p className="text-sm text-gray-600 dark:text-gray-300">
          公開プロフィールを有効にしている場合、取り込んだ視聴済み作品もプロフィールに表示されます。
        </p>
      )}
      {preview && (
        <div className="rounded-xl bg-fuchsia-50 dark:bg-gray-900 p-4 space-y-3 text-sm text-gray-800 dark:text-gray-200">
          <h3 className="font-bold break-all">取り込み内容：{sourceLabel}</h3>
          <p>
            追加する視聴記録：{preview.plan.animeCount}件 ／ 視聴予定：{preview.plan.watchlistCount}
            件
          </p>
          <p>追加しない重複：{preview.plan.skipped}件</p>
          <p>
            作品情報のIDが同じ作品は既存の記録を優先します。手動追加は名前だけでまとめません。以前取り込んだ記録は再追加しません。
          </p>
          <ul className="list-disc pl-5 break-words">
            {[
              ...preview.plan.additions.seasons.flatMap((season) =>
                season.animes.map((anime) => anime.title)
              ),
              ...preview.plan.additions.watchlist.map((item) => item.title),
            ]
              .slice(0, 5)
              .map((title, i) => (
                <li key={i}>{title}</li>
              ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || preview.plan.animeCount + preview.plan.watchlistCount === 0}
              onClick={() => void restore()}
              className="rounded-xl bg-fuchsia-700 text-white px-4 py-3 disabled:opacity-40"
            >
              確認した内容を取り込む
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setPreview(null);
                setMessage('');
              }}
              className="px-4 py-3 underline"
            >
              キャンセル
            </button>
            {message && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void prepare(async () => preview.source, sourceLabel)}
                className="px-4 py-3 underline"
              >
                内容を再確認
              </button>
            )}
          </div>
        </div>
      )}
      {!ownerId && (
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            復元前の端末記録は、このブラウザに直近1回分の控えを残します。
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={exportPrevious}
            className="text-sm underline text-fuchsia-800 dark:text-fuchsia-300 py-2"
          >
            復元前の記録を書き出す
          </button>
        </>
      )}
    </section>
  );
}
