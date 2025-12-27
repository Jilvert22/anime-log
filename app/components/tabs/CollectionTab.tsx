'use client';

import { useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Anime, Season, Achievement, FavoriteCharacter, EvangelistList, VoiceActor } from '../../types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AchievementsTab } from './AchievementsTab';
import { MusicTab } from './MusicTab';
import { characterCategories } from '../../constants';
import { supabase } from '../../lib/supabase';

export function CollectionTab({
  collectionSubTab,
  setCollectionSubTab,
  allAnimes,
  seasons,
  setSeasons,
  user,
  supabaseClient,
  achievements,
  favoriteCharacters,
  setFavoriteCharacters,
  characterFilter,
  setCharacterFilter,
  onOpenAddCharacterModal,
  onEditCharacter,
  quoteSearchQuery,
  setQuoteSearchQuery,
  quoteFilterType,
  setQuoteFilterType,
  selectedAnimeForFilter,
  setSelectedAnimeForFilter,
  onOpenAddQuoteModal,
  onEditQuote,
  evangelistLists,
  setEvangelistLists,
  listSortType,
  setListSortType,
  onSelectList,
  onOpenCreateListModal,
  voiceActors,
  setVoiceActors,
  voiceActorSearchQuery,
  setVoiceActorSearchQuery,
  onOpenAddVoiceActorModal,
  onEditVoiceActor,
  setSelectedAnime,
  setSongType,
  setNewSongTitle,
  setNewSongArtist,
  setShowSongModal,
}: {
  collectionSubTab: 'achievements' | 'characters' | 'quotes' | 'lists' | 'music' | 'voiceActors';
  setCollectionSubTab: (tab: 'achievements' | 'characters' | 'quotes' | 'lists' | 'music' | 'voiceActors') => void;
  allAnimes: Anime[];
  seasons: Season[];
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  supabaseClient: SupabaseClient;
  achievements: Achievement[];
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
  evangelistLists: EvangelistList[];
  setEvangelistLists: (lists: EvangelistList[]) => void;
  listSortType: 'date' | 'title' | 'count';
  setListSortType: (type: 'date' | 'title' | 'count') => void;
  onSelectList: (list: EvangelistList) => void;
  onOpenCreateListModal: () => void;
  voiceActors: VoiceActor[];
  setVoiceActors: (actors: VoiceActor[]) => void;
  voiceActorSearchQuery: string;
  setVoiceActorSearchQuery: (query: string) => void;
  onOpenAddVoiceActorModal: () => void;
  onEditVoiceActor: (actor: VoiceActor) => void;
  setSelectedAnime: (anime: Anime | null) => void;
  setSongType: (type: 'op' | 'ed' | null) => void;
  setNewSongTitle: (title: string) => void;
  setNewSongArtist: (artist: string) => void;
  setShowSongModal: (show: boolean) => void;
}) {
  return (
    <>
      {/* サブタブ */}
      <div className="flex gap-3 md:gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setCollectionSubTab('achievements')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'achievements'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          実績
        </button>
        <button
          onClick={() => setCollectionSubTab('characters')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'characters'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          推しキャラ
        </button>
        <button
          onClick={() => setCollectionSubTab('quotes')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'quotes'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          名言
        </button>
        <button
          onClick={() => setCollectionSubTab('lists')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'lists'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          布教リスト
        </button>
        <button
          onClick={() => setCollectionSubTab('music')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'music'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          主題歌
        </button>
        <button
          onClick={() => setCollectionSubTab('voiceActors')}
          className={`px-6 md:px-8 py-3 rounded-full text-base md:text-lg font-semibold whitespace-nowrap transition-all min-w-[100px] md:min-w-[120px] text-center ${
            collectionSubTab === 'voiceActors'
              ? 'bg-[#e879d4] text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          声優
        </button>
      </div>

      {collectionSubTab === 'achievements' && (
        <AchievementsTab 
          allAnimes={allAnimes}
          achievements={achievements}
          user={user}
          supabase={supabaseClient}
        />
      )}

      {collectionSubTab === 'characters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">推しキャラ</h2>
            <button
              onClick={onOpenAddCharacterModal}
              className="text-sm bg-[#e879d4] text-white px-4 py-2 rounded-lg hover:bg-[#f09fe3] transition-colors"
            >
              + 推しを追加
            </button>
          </div>
          
          {/* カテゴリフィルタ */}
          {favoriteCharacters.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setCharacterFilter(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  characterFilter === null
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                すべて
              </button>
              {characterCategories.map((category) => {
                const count = favoriteCharacters.filter(c => c.category === category.value).length;
                if (count === 0) return null;
                return (
                  <button
                    key={category.value}
                    onClick={() => setCharacterFilter(category.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      characterFilter === category.value
                        ? 'bg-[#e879d4] text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category.emoji} {category.label} ({count})
                  </button>
                );
              })}
            </div>
          )}
          
          {(() => {
            const filteredCharacters = characterFilter
              ? favoriteCharacters.filter(c => c.category === characterFilter)
              : favoriteCharacters;
            
            return filteredCharacters.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredCharacters.map((character) => (
                  <div
                    key={character.id}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md relative group"
                  >
                    {/* 編集・削除ボタン */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditCharacter(character)}
                        className="bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                        title="編集"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${character.name}を削除しますか？`)) {
                            setFavoriteCharacters(favoriteCharacters.filter(c => c.id !== character.id));
                          }
                        }}
                        className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    <div className="text-4xl text-center mb-2">{character.image}</div>
                    <h3 className="font-bold text-sm dark:text-white text-center mb-1">{character.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{character.animeName}</p>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-xs bg-[#e879d4]/20 dark:bg-[#e879d4]/20 text-[#e879d4] dark:text-[#e879d4] px-2 py-1 rounded-full">
                        {character.category}
                      </span>
                    </div>
                    {character.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center">
                        {character.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {character.tags.length > 3 && (
                          <span className="text-xs text-gray-400">+{character.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {characterFilter ? 'このカテゴリに推しキャラが登録されていません' : '推しキャラが登録されていません'}
              </p>
            );
          })()}
        </div>
      )}

      {collectionSubTab === 'quotes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">名言コレクション</h2>
            <button
              onClick={onOpenAddQuoteModal}
              className="text-sm bg-[#e879d4] text-white px-4 py-2 rounded-lg hover:bg-[#f09fe3] transition-colors"
            >
              + 名言を追加
            </button>
          </div>
          
          {(() => {
            const allQuotes: Array<{ text: string; character?: string; animeTitle: string; animeId: number }> = [];
            allAnimes.forEach((anime) => {
              anime.quotes?.forEach((quote) => {
                allQuotes.push({ ...quote, animeTitle: anime.title, animeId: anime.id });
              });
            });

            // フィルタリング
            const filteredQuotes = allQuotes.filter(quote => {
              // 検索クエリでフィルタ
              if (quoteSearchQuery && !quote.text.toLowerCase().includes(quoteSearchQuery.toLowerCase()) &&
                  !quote.animeTitle.toLowerCase().includes(quoteSearchQuery.toLowerCase()) &&
                  !(quote.character && quote.character.toLowerCase().includes(quoteSearchQuery.toLowerCase()))) {
                return false;
              }
              
              // アニメ別フィルタ
              if (quoteFilterType === 'anime' && selectedAnimeForFilter && quote.animeId !== selectedAnimeForFilter) {
                return false;
              }
              
              // キャラクター別フィルタ
              if (quoteFilterType === 'character' && !quote.character) {
                return false;
              }
              
              return true;
            });
            
            // アニメ一覧（フィルタ用）
            const uniqueAnimes = Array.from(new Set(allQuotes.map(q => q.animeId)))
              .map(id => allAnimes.find(a => a.id === id))
              .filter(Boolean) as Anime[];

            return (
              <>
                {/* 検索・フィルタ */}
                {allQuotes.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {/* 検索バー */}
                    <input
                      type="text"
                      value={quoteSearchQuery}
                      onChange={(e) => setQuoteSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                      placeholder="名言、アニメ、キャラクターで検索..."
                    />
                    
                    {/* フィルタボタン */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      <button
                        onClick={() => {
                          setQuoteFilterType('all');
                          setSelectedAnimeForFilter(null);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          quoteFilterType === 'all'
                            ? 'bg-[#e879d4] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        すべて
                      </button>
                      <button
                        onClick={() => {
                          setQuoteFilterType('anime');
                          setSelectedAnimeForFilter(null);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          quoteFilterType === 'anime'
                            ? 'bg-[#e879d4] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        アニメ別
                      </button>
                      <button
                        onClick={() => {
                          setQuoteFilterType('character');
                          setSelectedAnimeForFilter(null);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                          quoteFilterType === 'character'
                            ? 'bg-[#e879d4] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        キャラクター別
                      </button>
                    </div>
                    
                    {/* アニメ選択（アニメ別フィルタ時） */}
                    {quoteFilterType === 'anime' && (
                      <select
                        value={selectedAnimeForFilter || ''}
                        onChange={(e) => setSelectedAnimeForFilter(Number(e.target.value) || null)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">アニメを選択...</option>
                        {uniqueAnimes.map((anime) => (
                          <option key={anime.id} value={anime.id}>
                            {anime.title}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                
                {filteredQuotes.length > 0 ? (
                  <div className="space-y-3">
                    {(() => {
                      // 名言とアニメID、インデックスのマッピングを作成
                      const quoteMap: Array<{ quote: typeof filteredQuotes[0]; animeId: number; quoteIndex: number }> = [];
                      filteredQuotes.forEach((quote) => {
                        const anime = allAnimes.find(a => a.id === quote.animeId);
                        if (anime && anime.quotes) {
                          const quoteIndex = anime.quotes.findIndex(q => q.text === quote.text && q.character === quote.character);
                          if (quoteIndex !== -1) {
                            quoteMap.push({ quote, animeId: quote.animeId, quoteIndex });
                          }
                        }
                      });
                      
                      return quoteMap.map(({ quote, animeId, quoteIndex }) => (
                        <div
                          key={`${animeId}-${quoteIndex}`}
                          className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border-l-4 border-[#e879d4] relative group"
                        >
                          {/* 編集・削除ボタン */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditQuote(animeId, quoteIndex)}
                              className="bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                              title="編集"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('この名言を削除しますか？')) {
                                  const anime = allAnimes.find(a => a.id === animeId);
                                  if (anime && anime.quotes) {
                                    const updatedQuotes = anime.quotes.filter((_, i) => i !== quoteIndex);
                                    const updatedSeasons = seasons.map(season => ({
                                      ...season,
                                      animes: season.animes.map(a =>
                                        a.id === animeId
                                          ? { ...a, quotes: updatedQuotes }
                                          : a
                                      ),
                                    }));
                                    
                                    // Supabaseを更新（ログイン時のみ）
                                    if (user) {
                                      try {
                                        const { error } = await supabase
                                          .from('animes')
                                          .update({ quotes: updatedQuotes })
                                          .eq('id', animeId)
                                          .eq('user_id', user.id);
                                        
                                        if (error) throw error;
                                      } catch (error) {
                                        console.error('Failed to delete quote in Supabase:', error);
                                      }
                                    }
                                    
                                    setSeasons(updatedSeasons);
                                  }
                                }
                              }}
                              className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                              title="削除"
                            >
                              🗑️
                            </button>
                          </div>
                          
                          <p className="text-sm dark:text-white mb-2 pr-12">「{quote.text}」</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {quote.character ? `${quote.character} / ` : ''}{quote.animeTitle}
                          </p>
                        </div>
                      ));
                    })()}
                  </div>
                ) : allQuotes.length > 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">検索結果がありません</p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">名言が登録されていません</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {collectionSubTab === 'lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">布教リスト</h2>
            <button
              onClick={onOpenCreateListModal}
              className="text-sm bg-[#e879d4] text-white px-4 py-2 rounded-lg hover:bg-[#f09fe3] transition-colors"
            >
              + 新しいリストを作成
            </button>
          </div>
          
          {/* 並び替え */}
          {evangelistLists.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setListSortType('date')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  listSortType === 'date'
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                作成日順
              </button>
              <button
                onClick={() => setListSortType('title')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  listSortType === 'title'
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                タイトル順
              </button>
              <button
                onClick={() => setListSortType('count')}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  listSortType === 'count'
                    ? 'bg-[#e879d4] text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                作品数順
              </button>
            </div>
          )}
          
          {evangelistLists.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const sortedLists = [...evangelistLists].sort((a, b) => {
                  switch (listSortType) {
                    case 'date':
                      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                    case 'title':
                      return a.title.localeCompare(b.title, 'ja');
                    case 'count':
                      return b.animeIds.length - a.animeIds.length;
                    default:
                      return 0;
                  }
                });
                
                return sortedLists.map((list) => (
                  <div
                    key={list.id}
                    onClick={() => onSelectList(list)}
                    className="rounded-2xl p-4 shadow-md cursor-pointer hover:scale-105 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 35%, #e879d4 65%, #f093fb 100%)'
                    }}
                  >
                    <h3 className="font-bold text-white mb-1">{list.title}</h3>
                    <p className="text-white/80 text-sm mb-2">{list.description}</p>
                    <p className="text-white/60 text-xs">{list.animeIds.length}作品</p>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">布教リストが作成されていません</p>
          )}
        </div>
      )}

      {collectionSubTab === 'music' && (
        <MusicTab 
          allAnimes={allAnimes} 
          seasons={seasons} 
          setSeasons={setSeasons}
          setSelectedAnime={setSelectedAnime}
          setSongType={setSongType}
          setNewSongTitle={setNewSongTitle}
          setNewSongArtist={setNewSongArtist}
          setShowSongModal={setShowSongModal}
          user={user}
          supabase={supabaseClient}
        />
      )}

      {collectionSubTab === 'voiceActors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold dark:text-white">声優リスト</h2>
            <button
              onClick={onOpenAddVoiceActorModal}
              className="text-sm bg-[#e879d4] text-white px-4 py-2 rounded-lg hover:bg-[#f09fe3] transition-colors"
            >
              + 声優を追加
            </button>
          </div>

          {/* 検索バー */}
          {voiceActors.length > 0 && (
            <div className="mb-4">
              <input
                type="text"
                value={voiceActorSearchQuery}
                onChange={(e) => setVoiceActorSearchQuery(e.target.value)}
                placeholder="声優名で検索..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#e879d4] dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* 声優リスト */}
          {voiceActors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voiceActors
                .filter(va => 
                  voiceActorSearchQuery === '' || 
                  va.name.toLowerCase().includes(voiceActorSearchQuery.toLowerCase())
                )
                .map((voiceActor) => {
                  const animeList = voiceActor.animeIds
                    .map(id => allAnimes.find(a => a.id === id))
                    .filter(Boolean) as Anime[];
                  
                  return (
                    <div
                      key={voiceActor.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow relative group"
                    >
                      {/* 編集・削除ボタン（ホバー時表示） */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => onEditVoiceActor(voiceActor)}
                          className="bg-[#e879d4] text-white p-2 rounded-lg hover:bg-[#f09fe3] transition-colors text-xs"
                          title="編集"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('この声優を削除しますか？')) {
                              const updated = voiceActors.filter(va => va.id !== voiceActor.id);
                              setVoiceActors(updated);
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('voiceActors', JSON.stringify(updated));
                              }
                            }
                          }}
                          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors text-xs"
                          title="削除"
                        >
                          🗑️
                        </button>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-4xl">{voiceActor.image}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg dark:text-white mb-1">{voiceActor.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {voiceActor.animeIds.length}作品に出演
                          </p>
                          {animeList.length > 0 && (
                            <div className="space-y-1">
                              {animeList.slice(0, 3).map((anime) => (
                                <div key={anime.id} className="text-xs text-gray-600 dark:text-gray-300">
                                  • {anime.title}
                                </div>
                              ))}
                              {animeList.length > 3 && (
                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                  +{animeList.length - 3}作品
                                </div>
                              )}
                            </div>
                          )}
                          {voiceActor.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                              {voiceActor.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">声優が登録されていません</p>
          )}
        </div>
      )}
    </>
  );
}
