import { act, renderHook } from '@testing-library/react';
import { beforeEach, expect, it } from 'vitest';
import { useTabs } from '../../app/hooks/useTabs';

beforeEach(() => window.history.replaceState(null, '', '/'));
it('ショートカットの起動先を開き、タブ変更をURLへ反映する', () => {
  window.history.replaceState(null, '', '/?tab=watching');
  const { result } = renderHook(() => useTabs());
  expect(result.current.homeSubTab).toBe('watching');
  act(() => result.current.setActiveTab('mypage'));
  expect(new URLSearchParams(window.location.search).get('tab')).toBe('mypage');
  act(() => result.current.setHomeSubTab('watchlist'));
  expect(result.current.activeTab).toBe('home');
  expect(new URLSearchParams(window.location.search).get('tab')).toBe('watchlist');
});
it('戻る操作のpopstateで表示を戻す', () => {
  const { result } = renderHook(() => useTabs());
  act(() => result.current.setHomeSubTab('watching'));
  act(() => {
    window.history.replaceState(null, '', '/?tab=series');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.homeSubTab).toBe('series');
});
