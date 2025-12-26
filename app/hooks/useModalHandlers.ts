'use client';

import type { EvangelistList, FavoriteCharacter, VoiceActor } from '../types';

interface UseModalHandlersProps {
  evangelistLists: EvangelistList[];
  setEvangelistLists: (lists: EvangelistList[]) => void;
  favoriteCharacters: FavoriteCharacter[];
  setFavoriteCharacters: (characters: FavoriteCharacter[]) => void;
  voiceActors: VoiceActor[];
  setVoiceActors: (actors: VoiceActor[]) => void;
  editingList: EvangelistList | null;
  setEditingList: (list: EvangelistList | null) => void;
  editingCharacter: FavoriteCharacter | null;
  setEditingCharacter: (character: FavoriteCharacter | null) => void;
  editingVoiceActor: VoiceActor | null;
  setEditingVoiceActor: (actor: VoiceActor | null) => void;
  setShowCreateListModal: (show: boolean) => void;
  setShowAddCharacterModal: (show: boolean) => void;
  setShowAddVoiceActorModal: (show: boolean) => void;
  setNewCharacterName: (name: string) => void;
  setNewCharacterAnimeId: (id: number | null) => void;
  setNewCharacterImage: (image: string) => void;
  setNewCharacterCategory: (category: string) => void;
  setNewCharacterTags: (tags: string[]) => void;
  setNewCustomTag: (tag: string) => void;
  setNewVoiceActorName: (name: string) => void;
  setNewVoiceActorImage: (image: string) => void;
  setNewVoiceActorAnimeIds: (ids: number[]) => void;
  setNewVoiceActorNotes: (notes: string) => void;
}

export function useModalHandlers({
  evangelistLists,
  setEvangelistLists,
  favoriteCharacters,
  setFavoriteCharacters,
  voiceActors,
  setVoiceActors,
  editingList,
  setEditingList,
  editingCharacter,
  setEditingCharacter,
  editingVoiceActor,
  setEditingVoiceActor,
  setShowCreateListModal,
  setShowAddCharacterModal,
  setShowAddVoiceActorModal,
  setNewCharacterName,
  setNewCharacterAnimeId,
  setNewCharacterImage,
  setNewCharacterCategory,
  setNewCharacterTags,
  setNewCustomTag,
  setNewVoiceActorName,
  setNewVoiceActorImage,
  setNewVoiceActorAnimeIds,
  setNewVoiceActorNotes,
}: UseModalHandlersProps) {
  const handleCreateListSave = (list: { title: string; description: string; animeIds: number[] }) => {
    if (editingList) {
      const updatedLists = evangelistLists.map(l =>
        l.id === editingList.id
          ? {
              ...l,
              title: list.title,
              description: list.description,
              animeIds: list.animeIds,
            }
          : l
      );
      setEvangelistLists(updatedLists);
    } else {
      const newList: EvangelistList = {
        id: Date.now(),
        title: list.title,
        description: list.description,
        animeIds: list.animeIds,
        createdAt: new Date(),
      };
      setEvangelistLists([...evangelistLists, newList]);
    }
    setEditingList(null);
  };

  const handleCreateListClose = () => {
    setShowCreateListModal(false);
    setEditingList(null);
  };

  const handleCharacterSave = (character: FavoriteCharacter) => {
    if (editingCharacter) {
      setFavoriteCharacters(favoriteCharacters.map(c =>
        c.id === editingCharacter.id ? character : c
      ));
    } else {
      setFavoriteCharacters([...favoriteCharacters, character]);
    }
    setShowAddCharacterModal(false);
    setEditingCharacter(null);
  };

  const handleCharacterClose = () => {
    setShowAddCharacterModal(false);
    setEditingCharacter(null);
  };

  const handleOpenAddCharacterModal = () => {
    setNewCharacterName('');
    setNewCharacterAnimeId(null);
    setNewCharacterImage('👤');
    setNewCharacterCategory('');
    setNewCharacterTags([]);
    setNewCustomTag('');
    setEditingCharacter(null);
    setShowAddCharacterModal(true);
  };

  const handleEditCharacter = (character: FavoriteCharacter) => {
    setEditingCharacter(character);
    setNewCharacterName(character.name);
    setNewCharacterAnimeId(character.animeId);
    setNewCharacterImage(character.image);
    setNewCharacterCategory(character.category);
    setNewCharacterTags([...character.tags]);
    setNewCustomTag('');
    setShowAddCharacterModal(true);
  };

  const handleVoiceActorSave = (voiceActor: VoiceActor) => {
    if (editingVoiceActor) {
      setVoiceActors(voiceActors.map(va => 
        va.id === editingVoiceActor.id ? voiceActor : va
      ));
    } else {
      setVoiceActors([...voiceActors, voiceActor]);
    }
    setShowAddVoiceActorModal(false);
    setEditingVoiceActor(null);
  };

  const handleVoiceActorClose = () => {
    setShowAddVoiceActorModal(false);
    setEditingVoiceActor(null);
  };

  const handleOpenAddVoiceActorModal = () => {
    setNewVoiceActorName('');
    setNewVoiceActorImage('🎤');
    setNewVoiceActorAnimeIds([]);
    setNewVoiceActorNotes('');
    setEditingVoiceActor(null);
    setShowAddVoiceActorModal(true);
  };

  const handleEditVoiceActor = (actor: VoiceActor) => {
    setEditingVoiceActor(actor);
    setNewVoiceActorName(actor.name);
    setNewVoiceActorImage(actor.image);
    setNewVoiceActorAnimeIds(actor.animeIds);
    setNewVoiceActorNotes(actor.notes || '');
    setShowAddVoiceActorModal(true);
  };

  return {
    handleCreateListSave,
    handleCreateListClose,
    handleCharacterSave,
    handleCharacterClose,
    handleOpenAddCharacterModal,
    handleEditCharacter,
    handleVoiceActorSave,
    handleVoiceActorClose,
    handleOpenAddVoiceActorModal,
    handleEditVoiceActor,
  };
}

