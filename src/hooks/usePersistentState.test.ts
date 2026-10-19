import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('저장된 값이 없으면 초기값을 반환한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 초기값 대신 복원한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 JSON으로 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(localStorage.getItem('k')).toBe(JSON.stringify('next'));
  });

  it('저장된 JSON이 깨져 있으면 초기값을 반환한다', () => {
    localStorage.setItem('k', '{broken');
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('localStorage 쓰기가 실패해도 상태는 갱신된다', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
  });

  it('revive 함수로 복원된 값을 변환한다', () => {
    localStorage.setItem('k', JSON.stringify(['2026-01-01T00:00:00.000Z']));
    const { result } = renderHook(() =>
      usePersistentState<Date[]>('k', [], (raw) => (raw as string[]).map((s) => new Date(s))),
    );
    expect(result.current[0][0]).toBeInstanceOf(Date);
  });
});
