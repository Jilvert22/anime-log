'use client';

import { useCallback } from 'react';
import type { FavoriteCharacter } from '../types';

interface UseModalHandlersProps {
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
  editingCharacter: FavoriteCharacter | null;
  setEditingCharacter: (character: FavoriteCharacter | null) => void;
  setShowAddCharacterModal: (show: boolean) => void;
}

export function useModalHandlers({
  favoriteCharacters,
  setFavoriteCharacters,
  editingCharacter,
  setEditingCharacter,
  setShowAddCharacterModal,
}: UseModalHandlersProps) {

  // キャラクター保存
  const handleCharacterSave = useCallback(
    (character: FavoriteCharacter) => {
      if (editingCharacter) {
        setFavoriteCharacters(
          favoriteCharacters.map((c) => (c.id === editingCharacter.id ? character : c))
        );
      } else {
        setFavoriteCharacters([...favoriteCharacters, character]);
      }
      setShowAddCharacterModal(false);
      setEditingCharacter(null);
    },
    [editingCharacter, favoriteCharacters, setFavoriteCharacters, setShowAddCharacterModal, setEditingCharacter]
  );

  // キャラクターモーダルを閉じる
  const handleCharacterClose = useCallback(() => {
    setShowAddCharacterModal(false);
    setEditingCharacter(null);
  }, [setShowAddCharacterModal, setEditingCharacter]);

  // キャラクター追加モーダルを開く
  const handleOpenAddCharacterModal = useCallback(() => {
    setEditingCharacter(null);
    setShowAddCharacterModal(true);
  }, [
    setEditingCharacter,
    setShowAddCharacterModal,
  ]);

  // キャラクター編集
  const handleEditCharacter = useCallback(
    (character: FavoriteCharacter) => {
      setEditingCharacter(character);
      setShowAddCharacterModal(true);
    },
    [
      setEditingCharacter,
      setShowAddCharacterModal,
    ]
  );

  return {
    handleCharacterSave,
    handleCharacterClose,
    handleOpenAddCharacterModal,
    handleEditCharacter,
  };
}
