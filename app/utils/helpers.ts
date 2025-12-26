import { genreTranslation } from '../constants';

// ジャンルを日本語に変換
export const translateGenre = (genre: string): string => {
  return genreTranslation[genre] || genre;
};
