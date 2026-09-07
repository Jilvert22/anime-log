'use client';

import { useState, useEffect, useCallback } from 'react';
import type { HomeSubTab } from '../types';
import { parseTab } from '../lib/navigation';

export function useTabs() {
  const [activeTab, updateActiveTab] = useState<'home' | 'mypage'>('home');
  const [homeSubTab, updateHomeSubTab] = useState<HomeSubTab>('seasons');

  useEffect(() => {
    const restore = () => {
      const tab = parseTab(new URLSearchParams(window.location.search).get('tab'));
      updateActiveTab(tab === 'mypage' ? 'mypage' : 'home');
      if (tab !== 'mypage') updateHomeSubTab(tab);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  const navigate = useCallback((tab: HomeSubTab | 'mypage') => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') === tab) return;
    url.searchParams.set('tab', tab);
    window.history.pushState(null, '', url);
  }, []);
  const setActiveTab = useCallback(
    (tab: 'home' | 'mypage') => {
      updateActiveTab(tab);
      navigate(tab === 'mypage' ? tab : homeSubTab);
    },
    [homeSubTab, navigate]
  );
  const setHomeSubTab = useCallback(
    (tab: HomeSubTab) => {
      updateHomeSubTab(tab);
      updateActiveTab('home');
      navigate(tab);
    },
    [navigate]
  );

  return {
    activeTab,
    setActiveTab,
    homeSubTab,
    setHomeSubTab,
  };
}
