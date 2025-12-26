'use client';

import { useState } from 'react';
import type { FavoriteCharacter, VoiceActor, EvangelistList } from '../types';

export function useFormStates() {
  // キャラクター関連のフォーム状態
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterAnimeId, setNewCharacterAnimeId] = useState<number | null>(null);
  const [newCharacterImage, setNewCharacterImage] = useState('👤');
  const [newCharacterCategory, setNewCharacterCategory] = useState('');
  const [newCharacterTags, setNewCharacterTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [editingCharacter, setEditingCharacter] = useState<FavoriteCharacter | null>(null);
  const [characterFilter, setCharacterFilter] = useState<string | null>(null);

  // 声優関連のフォーム状態
  const [newVoiceActorName, setNewVoiceActorName] = useState('');
  const [newVoiceActorImage, setNewVoiceActorImage] = useState('🎤');
  const [newVoiceActorAnimeIds, setNewVoiceActorAnimeIds] = useState<number[]>([]);
  const [newVoiceActorNotes, setNewVoiceActorNotes] = useState('');
  const [editingVoiceActor, setEditingVoiceActor] = useState<VoiceActor | null>(null);
  const [voiceActorSearchQuery, setVoiceActorSearchQuery] = useState('');

  // 名言関連のフォーム状態
  const [editingQuote, setEditingQuote] = useState<{ animeId: number; quoteIndex: number } | null>(null);
  const [newQuoteAnimeId, setNewQuoteAnimeId] = useState<number | null>(null);
  const [newQuoteText, setNewQuoteText] = useState('');
  const [newQuoteCharacter, setNewQuoteCharacter] = useState('');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [quoteFilterType, setQuoteFilterType] = useState<'all' | 'anime' | 'character'>('all');
  const [selectedAnimeForFilter, setSelectedAnimeForFilter] = useState<number | null>(null);

  // リスト関連のフォーム状態
  const [selectedList, setSelectedList] = useState<EvangelistList | null>(null);
  const [editingList, setEditingList] = useState<EvangelistList | null>(null);
  const [listSortType, setListSortType] = useState<'date' | 'title' | 'count'>('date');

  // 楽曲関連のフォーム状態
  const [songType, setSongType] = useState<'op' | 'ed' | null>(null);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');

  return {
    // キャラクター関連
    newCharacterName,
    setNewCharacterName,
    newCharacterAnimeId,
    setNewCharacterAnimeId,
    newCharacterImage,
    setNewCharacterImage,
    newCharacterCategory,
    setNewCharacterCategory,
    newCharacterTags,
    setNewCharacterTags,
    newCustomTag,
    setNewCustomTag,
    editingCharacter,
    setEditingCharacter,
    characterFilter,
    setCharacterFilter,
    // 声優関連
    newVoiceActorName,
    setNewVoiceActorName,
    newVoiceActorImage,
    setNewVoiceActorImage,
    newVoiceActorAnimeIds,
    setNewVoiceActorAnimeIds,
    newVoiceActorNotes,
    setNewVoiceActorNotes,
    editingVoiceActor,
    setEditingVoiceActor,
    voiceActorSearchQuery,
    setVoiceActorSearchQuery,
    // 名言関連
    editingQuote,
    setEditingQuote,
    newQuoteAnimeId,
    setNewQuoteAnimeId,
    newQuoteText,
    setNewQuoteText,
    newQuoteCharacter,
    setNewQuoteCharacter,
    quoteSearchQuery,
    setQuoteSearchQuery,
    quoteFilterType,
    setQuoteFilterType,
    selectedAnimeForFilter,
    setSelectedAnimeForFilter,
    // リスト関連
    selectedList,
    setSelectedList,
    editingList,
    setEditingList,
    listSortType,
    setListSortType,
    // 楽曲関連
    songType,
    setSongType,
    newSongTitle,
    setNewSongTitle,
    newSongArtist,
    setNewSongArtist,
  };
}

