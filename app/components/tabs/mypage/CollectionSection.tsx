'use client';

import { useState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season, FavoriteCharacter, SupabaseClientType } from '../../../types';
import { characterCategories } from '../../../constants';
import { MusicTab } from '../MusicTab';

interface CollectionSectionProps {
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  supabaseClient: SupabaseClientType;
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
  characterFilter: string | null;
  setCharacterFilter: (filter: string | null) => void;
  onOpenAddCharacterModal: () => void;
  onEditCharacter: (character: FavoriteCharacter) => void;
  quoteSearchQuery: string;
  setQuoteSearchQuery: (query: string) => void;
  quoteFilterType: 'all' | 'anime' | 'character';
  setQuoteFilterType: (type: 'all' | 'anime' | 'character') => void;
  selectedAnimeForFilter: number | null;
  setSelectedAnimeForFilter: (id: number | null) => void;
  onOpenAddQuoteModal: () => void;
  onEditQuote: (animeId: number, quoteIndex: number) => void;
  setSelectedAnime: (anime: Anime | null) => void;
  setShowSongModal: (show: boolean) => void;
}

type CategoryType = 'characters' | 'quotes' | 'songs' | null;

interface CollectionCardProps {
  label: string;
  count: number;
  selected: boolean;
  onClick: () => void;
}

function CollectionCard({ label, count, selected, onClick }: CollectionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-xl text-center transition-all duration-300 font-mixed ${
        selected
          ? 'bg-gradient-to-br from-[#e879d4]/20 to-purple-500/20 border-2 border-[#e879d4] shadow-lg shadow-[#e879d4]/20'
          : 'bg-gray-100 dark:bg-gray-700/50 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className={`font-bold text-2xl font-mixed ${selected ? 'text-[#e879d4]' : 'text-[#6b5b6e] dark:text-white'}`}>
        {count}
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-base font-mixed mt-0.5">{label}</div>
    </button>
  );
}

interface CollectionDetailProps {
  title: string;
  count: number;
  onAdd: () => void;
  children: React.ReactNode;
}

function CollectionDetail({ title, count, onAdd, children }: CollectionDetailProps) {
  return (
    <div className="bg-gray-100 dark:bg-gray-700/30 rounded-xl p-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[#6b5b6e] dark:text-white font-medium font-mixed">
          {title} ({count})
        </span>
        <button
          onClick={onAdd}
          className="text-[#e879d4] hover:text-[#f09fe3] transition-colors font-mixed"
        >
          + 追加
        </button>
      </div>
      {children}
    </div>
  );
}

export default function CollectionSection(props: CollectionSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(null);

  // カウント計算
  const counts = useMemo(() => {
    const characters = props.favoriteCharacters?.length || 0;
    const quotes = props.allAnimes?.reduce((sum, anime) => 
      sum + (anime.quotes?.length || 0), 0) || 0;
    const songs = props.allAnimes?.reduce((sum, anime) => {
      let count = 0;
      if (anime.songs?.op) count++;
      if (anime.songs?.ed) count++;
      return sum + count;
    }, 0) || 0;
    return { characters, quotes, songs };
  }, [props.favoriteCharacters, props.allAnimes]);

  const toggleCategory = (category: CategoryType) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };

  const filteredCharacters = props.characterFilter
    ? props.favoriteCharacters.filter(c => c.category === props.characterFilter)
    : props.favoriteCharacters;

  const allQuotesList: Array<{ text: string; character?: string; animeTitle: string; animeId: number }> = [];
  props.allAnimes.forEach((anime) => {
    anime.quotes?.forEach((quote) => {
      allQuotesList.push({ ...quote, animeTitle: anime.title, animeId: anime.id });
    });
  });

  const filteredQuotes = allQuotesList.filter(quote => {
    if (props.quoteSearchQuery && !quote.text.toLowerCase().includes(props.quoteSearchQuery.toLowerCase()) &&
        !quote.animeTitle.toLowerCase().includes(props.quoteSearchQuery.toLowerCase()) &&
        !(quote.character && quote.character.toLowerCase().includes(props.quoteSearchQuery.toLowerCase()))) {
      return false;
    }
    if (props.quoteFilterType === 'anime' && props.selectedAnimeForFilter && quote.animeId !== props.selectedAnimeForFilter) {
      return false;
    }
    if (props.quoteFilterType === 'character' && !quote.character) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-gray-800/40 rounded-2xl p-5 backdrop-blur shadow-md">
      {/* ヘッダー */}
      <h2 className="text-lg font-bold mb-4 text-[#6b5b6e] dark:text-white font-mixed">
        コレクション
      </h2>

      {/* コレクションカード（常時表示） */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <CollectionCard
          label="推しキャラ"
          count={counts.characters}
          selected={selectedCategory === 'characters'}
          onClick={() => toggleCategory('characters')}
        />
        <CollectionCard
          label="名言"
          count={counts.quotes}
          selected={selectedCategory === 'quotes'}
          onClick={() => toggleCategory('quotes')}
        />
        <CollectionCard
          label="主題歌"
          count={counts.songs}
          selected={selectedCategory === 'songs'}
          onClick={() => toggleCategory('songs')}
        />
      </div>

      {/* 選択時の詳細表示 */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
        selectedCategory ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {selectedCategory === 'characters' && (
          <CollectionDetail
            title="推しキャラ"
            count={counts.characters}
            onAdd={props.onOpenAddCharacterModal}
          >
            {props.favoriteCharacters.length > 0 && (
              <div className="space-y-3">
                {/* カテゴリフィルタ */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => props.setCharacterFilter(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all font-mixed ${
                      props.characterFilter === null
                        ? 'bg-[#e879d4] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    すべて
                  </button>
                  {characterCategories.map((category) => {
                    const count = props.favoriteCharacters.filter(c => c.category === category.value).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={category.value}
                        onClick={() => props.setCharacterFilter(category.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all font-mixed ${
                          props.characterFilter === category.value
                            ? 'bg-[#e879d4] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {category.emoji} {category.label} ({count})
                      </button>
                    );
                  })}
                </div>
                
                {filteredCharacters.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredCharacters.slice(0, 4).map((character) => (
                      <div
                        key={character.id}
                        className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md relative group"
                      >
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => props.onEditCharacter(character)}
                            className="bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                            title="編集"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`${character.name}を削除しますか？`)) {
                                props.setFavoriteCharacters(props.favoriteCharacters.filter(c => c.id !== character.id));
                              }
                            }}
                            className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                            title="削除"
                          >
                            🗑️
                          </button>
                        </div>
                        
                        <div className="text-4xl text-center mb-2">{character.image}</div>
                        <h3 className="font-bold text-sm text-[#6b5b6e] dark:text-white text-center mb-1 font-mixed">{character.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2 font-mixed">{character.animeName}</p>
                        <div className="flex items-center justify-center mb-2">
                          <span className="text-xs bg-[#e879d4]/20 dark:bg-[#e879d4]/20 text-[#e879d4] dark:text-[#e879d4] px-2 py-1 rounded-full font-mixed">
                            {character.category}
                          </span>
                        </div>
                      </div>
                    ))}
                    {filteredCharacters.length > 4 && (
                      <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 text-sm font-mixed">
                        +{filteredCharacters.length - 4}件の推しキャラ
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4 font-mixed">
                    推しキャラが登録されていません
                  </p>
                )}
              </div>
            )}
          </CollectionDetail>
        )}

        {selectedCategory === 'quotes' && (
          <CollectionDetail
            title="名言"
            count={counts.quotes}
            onAdd={props.onOpenAddQuoteModal}
          >
            {allQuotesList.length > 0 && (
              <div className="space-y-3">
                {filteredQuotes.slice(0, 3).map((quote, index) => {
                  return (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border-l-4 border-[#e879d4]"
                    >
                      <p className="text-sm text-[#6b5b6e] dark:text-white mb-2 font-mixed">「{quote.text}」</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mixed">
                        {quote.character ? `${quote.character} / ` : ''}{quote.animeTitle}
                      </p>
                    </div>
                  );
                })}
                {filteredQuotes.length > 3 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm font-mixed">
                    +{filteredQuotes.length - 3}件の名言
                  </div>
                )}
              </div>
            )}
          </CollectionDetail>
        )}

        {selectedCategory === 'songs' && (
          <CollectionDetail
            title="主題歌"
            count={counts.songs}
            onAdd={() => {
              props.setSelectedAnime(null);
              props.setShowSongModal(true);
            }}
          >
            <MusicTab 
              allAnimes={props.allAnimes} 
              seasons={props.seasons} 
              setSeasons={props.setSeasons}
              setSelectedAnime={props.setSelectedAnime}
              setShowSongModal={props.setShowSongModal}
              user={props.user}
              supabase={props.supabaseClient}
            />
          </CollectionDetail>
        )}
      </div>

      {/* 未選択時のメッセージ */}
      {!selectedCategory && (
        <div className="text-center text-gray-400 dark:text-gray-500 py-4 text-sm font-mixed">
          カードをタップして詳細を表示
        </div>
      )}
    </div>
  );
}
