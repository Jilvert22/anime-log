'use client';

import { useState } from 'react';

export function useTabs() {
  const [activeTab, setActiveTab] = useState<'home' | 'mypage'>('home');
  const [homeSubTab, setHomeSubTab] = useState<'seasons' | 'series' | 'gallery' | 'watchlist' | 'current-season'>('seasons');

  return {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
  };
}

