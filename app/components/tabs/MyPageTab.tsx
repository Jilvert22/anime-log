'use client';

import type { User } from '@supabase/supabase-js';
import type { Anime, Season, FavoriteCharacter, SupabaseClientType } from '../../types';
import AnimeDNASection from './mypage/AnimeDNASection';
import StatisticsSection from './mypage/StatisticsSection';
import CollectionSection from './mypage/CollectionSection';
import SettingsSection from './mypage/SettingsSection';
import { Footer } from '../common/Footer';

interface MyPageTabProps {
  allAnimes: Anime[];
  seasons: Season[];
  userName: string;
  userIcon: string | null;
  userHandle: string | null;
  userOtakuType: string;
  setUserOtakuType: (type: string) => void;
  favoriteAnimeIds: number[];
  setFavoriteAnimeIds: (ids: number[]) => void;
  averageRating: number;
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
  characterFilter: string | null;
  setCharacterFilter: (filter: string | null) => void;
  quoteSearchQuery: string;
  setQuoteSearchQuery: (query: string) => void;
  quoteFilterType: 'all' | 'anime' | 'character';
  setQuoteFilterType: (type: 'all' | 'anime' | 'character') => void;
  selectedAnimeForFilter: number | null;
  setSelectedAnimeForFilter: (id: number | null) => void;
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  supabaseClient: SupabaseClientType;
  onOpenDNAModal: () => void;
  onOpenSettingsModal: () => void;
  setShowFavoriteAnimeModal: (show: boolean) => void;
  onOpenCharacterModal: () => void;
  onEditCharacter: (character: FavoriteCharacter) => void;
  onOpenAddQuoteModal: () => void;
  onEditQuote: (animeId: number, quoteIndex: number) => void;
  setSelectedAnime: (anime: Anime | null) => void;
  setSongType: (type: 'op' | 'ed' | null) => void;
  setNewSongTitle: (title: string) => void;
  setNewSongArtist: (artist: string) => void;
  setShowSongModal: (show: boolean) => void;
  handleLogout: () => void;
}

export default function MyPageTab(props: MyPageTabProps) {
  return (
    <div className="space-y-6">
      {/* ANIME DNAカード */}
      <AnimeDNASection 
        allAnimes={props.allAnimes}
        seasons={props.seasons}
        userName={props.userName}
        userIcon={props.userIcon}
        userHandle={props.userHandle}
        userOtakuType={props.userOtakuType}
        setUserOtakuType={props.setUserOtakuType}
        favoriteAnimeIds={props.favoriteAnimeIds}
        setFavoriteAnimeIds={props.setFavoriteAnimeIds}
        averageRating={props.averageRating}
        setShowFavoriteAnimeModal={props.setShowFavoriteAnimeModal}
        onOpenDNAModal={props.onOpenDNAModal}
      />
      
      {/* 統計・傾向とコレクション（同じレイヤー） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 統計・傾向 */}
        <StatisticsSection 
          allAnimes={props.allAnimes}
          seasons={props.seasons}
        />
        
        {/* コレクション（アコーディオン） */}
        <CollectionSection 
          allAnimes={props.allAnimes}
          seasons={props.seasons}
          setSeasons={props.setSeasons}
          user={props.user}
          supabaseClient={props.supabaseClient}
          favoriteCharacters={props.favoriteCharacters}
          setFavoriteCharacters={props.setFavoriteCharacters}
          characterFilter={props.characterFilter}
          setCharacterFilter={props.setCharacterFilter}
          onOpenAddCharacterModal={props.onOpenCharacterModal}
          onEditCharacter={props.onEditCharacter}
          quoteSearchQuery={props.quoteSearchQuery}
          setQuoteSearchQuery={props.setQuoteSearchQuery}
          quoteFilterType={props.quoteFilterType}
          setQuoteFilterType={props.setQuoteFilterType}
          selectedAnimeForFilter={props.selectedAnimeForFilter}
          setSelectedAnimeForFilter={props.setSelectedAnimeForFilter}
          onOpenAddQuoteModal={props.onOpenAddQuoteModal}
          onEditQuote={props.onEditQuote}
          setSelectedAnime={props.setSelectedAnime}
          setSongType={props.setSongType}
          setNewSongTitle={props.setNewSongTitle}
          setNewSongArtist={props.setNewSongArtist}
          setShowSongModal={props.setShowSongModal}
        />
      </div>
      
      {/* 設定 */}
      <SettingsSection 
        onOpenSettingsModal={props.onOpenSettingsModal}
        handleLogout={props.handleLogout}
      />
      
      {/* フッター */}
      <Footer />
    </div>
  );
}

