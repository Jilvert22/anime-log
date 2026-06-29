/**
 * アニメの放送開始日を表示用文字列に整形するユーティリティ
 */

type FuzzyDate = { year: number | null; month: number | null; day?: number | null } | null | undefined;

/**
 * AniList の startDate を「7/3〜」のような短縮形式に整形する。
 *
 * - year/month/day が全て揃えば「M/D〜」
 * - day が無ければ「M月〜」
 * - month も無ければ null (表示しない)
 *
 * 「〜」を付けるのは「この日から始まる継続的な放送」を示すため。
 * シーズン跨ぎを意識させるよう、年は省略する (UI上はシーズン情報と一緒に出る前提)。
 */
export function formatStartDate(startDate: FuzzyDate): string | null {
  if (!startDate || startDate.month == null) return null;
  const month = startDate.month;
  const day = startDate.day;
  if (day != null) {
    return `${month}/${day}〜`;
  }
  return `${month}月〜`;
}
