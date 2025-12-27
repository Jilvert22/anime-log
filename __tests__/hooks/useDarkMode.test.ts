import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '../../app/hooks/useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    // localStorageをリセット
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    // documentのクラスリストをモック
    document.documentElement.classList.remove('dark');
  });

  it('初期値はfalse（ライトモード）', () => {
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDarkMode).toBe(false);
  });

  it('setIsDarkModeでダークモードを切り替えられる', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.setIsDarkMode(true);
    });
    
    expect(result.current.isDarkMode).toBe(true);
  });

  it('localStorageに保存された値を読み込む', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('true');
    
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDarkMode).toBe(true);
  });
});



