'use client';

import type { User } from '@supabase/supabase-js';
import type { Anime, Season, FavoriteCharacter, SupabaseClientType } from '../../types';
import AnimeDNASection from './mypage/AnimeDNASection';
import StatisticsSection from './mypage/StatisticsSection';
import CollectionSection from './mypage/CollectionSection';
import SettingsSection from './mypage/SettingsSection';
import { Footer } from '../common/Footer';
import { useUserProfileContext } from '../../contexts/UserProfileContext';
import { useModalContext } from '../../contexts/ModalContext';

interface MyPageTabProps {
  allAnimes: Anime[];
  seasons: Season[];
  averageRating: number;
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
  setSeasons: (seasons: Season[]) => void;
  user: User | null;
  supabaseClient: SupabaseClientType;
  setSelectedAnime: (anime: Anime | null) => void;
  handleLogout: () => void;
}

export default function MyPageTab(props: MyPageTabProps) {
  // Contextからユーザープロフィール情報を取得
  const {
    userName,
    userIcon,
    userHandle,
    userOtakuType,
    setUserOtakuType,
    favoriteAnimeIds,
    setFavoriteAnimeIds,
  } = useUserProfileContext();
  
  // Contextからモーダル関連の状態とアクションを取得
  const { modals, actions, formStates } = useModalContext();
  
  // モーダルハンドラ（キャラクター関連は後でContext化する可能性があるが、今回はpropsとして受け取る）
  // 注意: useModalHandlersはfavoriteCharactersに依存するため、ここでは使用しない
  return (
    <div className="space-y-6">
      {/* ANIME DNAカード */}
      <AnimeDNASection 
        allAnimes={props.allAnimes}
        seasons={props.seasons}
        userName={userName}
        userIcon={userIcon}
        userHandle={userHandle}
        userOtakuType={userOtakuType}
        setUserOtakuType={setUserOtakuType}
        favoriteAnimeIds={favoriteAnimeIds}
        setFavoriteAnimeIds={setFavoriteAnimeIds}
        averageRating={props.averageRating}
        setShowFavoriteAnimeModal={modals.setShowFavoriteAnimeModal}
        onOpenDNAModal={() => modals.setShowDNAModal(true)}
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
          characterFilter={formStates.characterFilter}
          setCharacterFilter={formStates.setCharacterFilter}
          onOpenAddCharacterModal={() => modals.setShowAddCharacterModal(true)}
          onEditCharacter={(character: FavoriteCharacter) => {
            formStates.setEditingCharacter(character);
            modals.setShowAddCharacterModal(true);
          }}
          quoteSearchQuery={formStates.quoteSearchQuery}
          setQuoteSearchQuery={formStates.setQuoteSearchQuery}
          quoteFilterType={formStates.quoteFilterType}
          setQuoteFilterType={formStates.setQuoteFilterType}
          selectedAnimeForFilter={formStates.selectedAnimeForFilter}
          setSelectedAnimeForFilter={formStates.setSelectedAnimeForFilter}
          onOpenAddQuoteModal={actions.openAddQuoteModal}
          onEditQuote={actions.editQuote}
          setSelectedAnime={props.setSelectedAnime}
          setShowSongModal={modals.setShowSongModal}
        />
      </div>
      
      {/* 設定 */}
      <SettingsSection 
        onOpenSettingsModal={() => modals.setShowSettings(true)}
        handleLogout={props.handleLogout}
      />
      
      {/* フッター */}
      <Footer />
    </div>
  );
}

