'use client';

import { useState } from 'react';

export function useTabs() {
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'collection' | 'profile'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'seasons' | 'series'>('seasons');
  const [discoverSubTab, setDiscoverSubTab] = useState<'trends'>('trends');
  const [collectionSubTab, setCollectionSubTab] = useState<'achievements' | 'characters' | 'quotes' | 'lists' | 'music' | 'voiceActors'>('achievements');

  return {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
    discoverSubTab,
    setDiscoverSubTab,
    collectionSubTab,
    setCollectionSubTab,
  };
}

