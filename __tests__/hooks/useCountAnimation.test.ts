import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountAnimation } from '../../app/hooks/useCountAnimation';

describe('useCountAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初期値は0', () => {
    const { result } = renderHook(() => useCountAnimation(10));
    expect(result.current).toBe(0);
  });

  it('時間経過でターゲット値に近づく', () => {
    const { result } = renderHook(() => useCountAnimation(10));
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect(result.current).toBeGreaterThan(0);
  });

  it('ターゲットが0の場合は0のまま', () => {
    const { result } = renderHook(() => useCountAnimation(0));
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current).toBe(0);
  });
});



