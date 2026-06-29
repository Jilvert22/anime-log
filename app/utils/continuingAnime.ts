/**
 * 連続2クール（および2クール以上の長期作品）を判定するユーティリティ
 *
 * 背景:
 *   AniListは「放送開始シーズン」でしかアニメを分類しない。
 *   例: 2025年春に開始して夏まで続く2クール作品は season=SPRING でしか引けず、
 *       夏クールを検索しても出てこない。
 *   このユーティリティで「ある作品がターゲットシーズンに継続中か」を推定する。
 *
 * 判定方針 (合意済み・v1):
 *   - 主シグナル : episodes が 14 以上 → 確実に2クール以上
 *   - 副シグナル : status が RELEASING で、開始シーズンの境界を超えて放送中
 *   - episodes が null の場合 : 安全側に倒して「継続中の可能性あり」と扱う
 *   - ただし作品の開始がターゲットシーズン以降なら継続ではない（純粋な新作 / 未開始）
 */

import type { AniListMedia } from '../lib/anilist';
import type { Season } from '../lib/api/types';

const SEASON_ORDER: readonly Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'] as const;

/**
 * target の1つ前のシーズンを返す。
 * 例: 2025 SPRING → 2024 WINTER, 2026 WINTER → 2025 FALL
 */
export function getPreviousSeason(target: { year: number; season: Season }): {
  year: number;
  season: Season;
} {
  const idx = SEASON_ORDER.indexOf(target.season);
  if (idx === 0) {
    return { year: target.year - 1, season: 'FALL' };
  }
  return { year: target.year, season: SEASON_ORDER[idx - 1] };
}

/**
 * (year, season) を一連の整数に変換する。比較・差分計算用。
 * 例: 2025 SPRING → 2025*4 + 1 = 8101
 */
export function seasonIndex(year: number, season: Season): number {
  return year * 4 + SEASON_ORDER.indexOf(season);
}

/**
 * AniListの開始月 (1-12) から該当シーズンを推定する。
 * AniList の `season` フィールドが欠落している場合のフォールバック。
 */
export function seasonFromMonth(month: number): Season {
  if (month >= 1 && month <= 3) return 'WINTER';
  if (month >= 4 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 9) return 'SUMMER';
  return 'FALL';
}

/**
 * media の開始 (year, season) を返す。
 * media.season/seasonYear を優先し、なければ startDate から推定。
 * いずれも得られない場合は null。
 */
export function getStartSeason(media: AniListMedia): { year: number; season: Season } | null {
  if (media.seasonYear != null && media.season != null) {
    return { year: media.seasonYear, season: media.season };
  }
  if (media.startDate?.year != null && media.startDate?.month != null) {
    return { year: media.startDate.year, season: seasonFromMonth(media.startDate.month) };
  }
  return null;
}

/**
 * 「ある作品が target シーズンに継続中とみなせるか」を判定する純粋関数。
 *
 * @param media       AniList から取得した作品データ
 * @param target      判定したいシーズン (例: 今期 or 来期)
 * @returns           target シーズンに継続中とみなすなら true
 *
 * 実装の指針:
 *   1. 開始シーズン (start) が取れなければ false
 *   2. start === target なら「継続」ではなく「新規」なので false
 *   3. start が target より未来なら false (まだ始まってない)
 *   4. start が target より過去で、かつ以下のいずれかに該当 → true
 *      - episodes >= 14 (主シグナル)
 *      - status === 'RELEASING' (副シグナル — まだ放送中)
 *      - episodes == null (安全側推定 — 話数不明だが過去開始)
 *   5. それ以外は false
 *
 * TODO: ここから下の本体ロジックを永安さんに書いてもらう
 */
export function isContinuingAnime(
  media: AniListMedia,
  target: { year: number; season: Season }
): boolean {
  const start = getStartSeason(media);
  if (!start) return false;

  const startIdx = seasonIndex(start.year, start.season);
  const targetIdx = seasonIndex(target.year, target.season);

  // 同シーズン開始 (新規) or 未来開始 (未放送) は継続ではない
  if (startIdx >= targetIdx) return false;

  // 中止・休止は継続扱いしない
  if (media.status === 'CANCELLED' || media.status === 'HIATUS') return false;

  // 主シグナル: 話数が2クール以上
  if (typeof media.episodes === 'number' && media.episodes >= 14) return true;

  // 副シグナル: まだ放送中 (前シーズン開始かつ RELEASING)
  if (media.status === 'RELEASING') return true;

  // 安全側推定: 話数不明の作品は継続中の可能性ありとして拾う
  if (media.episodes == null) return true;

  return false;
}
