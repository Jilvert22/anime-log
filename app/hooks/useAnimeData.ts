'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { SetStateAction } from 'react';
import { getAnimesByUser } from '../lib/api/animes';
import type { User } from '@supabase/supabase-js';
import type { Season, Anime } from '../types';
import { supabaseToAnime, sortSeasonsByTime } from '../utils/helpers';
import { readGuestSeasons, RECORDS_CHANGED_EVENT } from '../lib/records/guest';

const EMPTY: Season[] = [];
type LoadedData = {
  owner: string | null;
  request: number;
  revision: number;
  seasons: Season[];
  ready: boolean;
  error: boolean;
};

export function useAnimeData(user: User | null, isLoading: boolean) {
  const owner = isLoading ? null : (user?.id ?? 'guest');
  const [loaded, setLoaded] = useState<LoadedData>({
    owner: null,
    request: 0,
    revision: 0,
    seasons: [],
    ready: false,
    error: false,
  });
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set());
  const [revision, setRevision] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const [saveAttempt, setSaveAttempt] = useState(0);
  const requestRef = useRef(0);
  const savedRef = useRef<string | null>(null);
  const current = loaded.owner === owner && loaded.revision === revision && owner !== null;
  const seasons = current ? loaded.seasons : EMPTY;
  const isAnimeDataReady = current && loaded.ready;
  const loadError = current && loaded.error;
  const reloadAnimeData = useCallback(() => setRevision((n) => n + 1), []);
  const retrySave = useCallback(() => setSaveAttempt((n) => n + 1), []);

  const setSeasons = useCallback(
    (update: SetStateAction<Season[]>) => {
      setLoaded((previous) => {
        // 別アカウントや再読み込み前に開始された非同期操作の結果を混ぜない。
        if (
          previous.owner !== owner ||
          previous.request !== loaded.request ||
          !previous.ready ||
          previous.error
        )
          return previous;
        return {
          ...previous,
          seasons: typeof update === 'function' ? update(previous.seasons) : update,
        };
      });
    },
    [owner, loaded.request]
  );

  useEffect(() => {
    let active = true;
    const request = ++requestRef.current;
    setSaveError(false);
    if (!owner) return;
    async function load() {
      try {
        let next: Season[];
        if (owner === 'guest') {
          next = readGuestSeasons();
          savedRef.current = localStorage.getItem('animeSeasons');
        } else {
          const rows = await getAnimesByUser(owner!);
          const grouped = new Map<string, Anime[]>();
          for (const row of rows) {
            const name = row.season_name || '未分類';
            if (!grouped.has(name)) grouped.set(name, []);
            grouped.get(name)!.push(supabaseToAnime(row));
          }
          next = sortSeasonsByTime([...grouped].map(([name, animes]) => ({ name, animes })));
        }
        if (!active) return;
        setLoaded({ owner, request, revision, seasons: next, ready: true, error: false });
        setExpandedSeasons(new Set(next.length ? [next[0].name] : []));
      } catch {
        if (active) setLoaded({ owner, request, revision, seasons: [], ready: true, error: true });
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [owner, revision]);

  useEffect(() => {
    if (owner !== 'guest' || !isAnimeDataReady || loadError) return;
    const serialized = JSON.stringify(seasons);
    try {
      const currentValue = localStorage.getItem('animeSeasons');
      if (serialized !== currentValue) {
        if (currentValue !== savedRef.current) throw new Error('別のタブで記録が更新されました');
        localStorage.setItem('animeSeasons', serialized);
      }
      savedRef.current = serialized;
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [seasons, owner, isAnimeDataReady, loadError, saveAttempt]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (!saveError && (event.key === 'animeSeasons' || event.key === null)) reloadAnimeData();
    };
    window.addEventListener(RECORDS_CHANGED_EVENT, reloadAnimeData);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(RECORDS_CHANGED_EVENT, reloadAnimeData);
      window.removeEventListener('storage', onStorage);
    };
  }, [reloadAnimeData, saveError]);

  const allAnimes = useMemo(() => seasons.flatMap((season) => season.animes), [seasons]);
  const averageRating = useMemo(() => {
    const rated = allAnimes.filter((anime) => anime.rating > 0);
    return rated.length ? rated.reduce((sum, anime) => sum + anime.rating, 0) / rated.length : 0;
  }, [allAnimes]);
  const totalRewatchCount = useMemo(
    () => allAnimes.reduce((sum, anime) => sum + (anime.rewatchCount ?? 0), 0),
    [allAnimes]
  );
  return {
    seasons,
    setSeasons,
    expandedSeasons,
    setExpandedSeasons,
    allAnimes,
    averageRating,
    totalRewatchCount,
    isAnimeDataReady,
    loadError,
    reloadAnimeData,
    saveError: current && saveError,
    retrySave,
  };
}
