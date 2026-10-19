import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const STORAGE_KEY = 'rcg:components';

describe('useComponentGenerator 영속화', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('생성된 컴포넌트를 localStorage에 저장한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'render(<div />)' }), { status: 200 }),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('카드', undefined, 'google'));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(saved).toHaveLength(1);
    expect(saved[0].prompt).toBe('카드');
  });

  it('저장된 컴포넌트를 복원하고 createdAt을 Date로 되돌린다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );
    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].createdAt).toBeInstanceOf(Date);
  });

  it('전체 삭제하면 저장된 목록도 비워진다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00.000Z' }]),
    );
    const { result } = renderHook(() => useComponentGenerator());

    act(() => result.current.clearAll());

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')).toEqual([]);
  });
});
