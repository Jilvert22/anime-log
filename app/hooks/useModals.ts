'use client';

import { useState } from 'react';

export function useModals() {
  const [showSettings, setShowSettings] = useState(false);
  const [showFavoriteAnimeModal, setShowFavoriteAnimeModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDNAModal, setShowDNAModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [showAddVoiceActorModal, setShowAddVoiceActorModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [showSongModal, setShowSongModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  return {
    showSettings,
    setShowSettings,
    showFavoriteAnimeModal,
    setShowFavoriteAnimeModal,
    showAddForm,
    setShowAddForm,
    showDNAModal,
    setShowDNAModal,
    showShareModal,
    setShowShareModal,
    showAuthModal,
    setShowAuthModal,
    showCreateListModal,
    setShowCreateListModal,
    showAddCharacterModal,
    setShowAddCharacterModal,
    showAddVoiceActorModal,
    setShowAddVoiceActorModal,
    showAddQuoteModal,
    setShowAddQuoteModal,
    showSongModal,
    setShowSongModal,
    showReviewModal,
    setShowReviewModal,
  };
}

