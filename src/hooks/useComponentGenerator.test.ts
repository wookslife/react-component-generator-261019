import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useComponentGenerator, MAX_COMPONENTS } from './useComponentGenerator';

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

  it('형식이 깨진 항목은 버리고 정상 항목만 복원한다', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        null,
        { id: 'only-id' },
        { id: '2', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
        { id: '1', prompt: 'p', code: 'c', createdAt: '2026-01-01T00:00:00.000Z' },
      ]),
    );
    const { result } = renderHook(() => useComponentGenerator());

    expect(result.current.components.map((c) => c.id)).toEqual(['1']);
  });

  it('저장 목록은 최대 개수를 넘으면 가장 오래된 항목부터 버린다', async () => {
    const stored = Array.from({ length: MAX_COMPONENTS }, (_, i) => ({
      id: `old-${i}`,
      prompt: 'p',
      code: 'c',
      createdAt: '2026-01-01T00:00:00.000Z',
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'render(<div />)' }), { status: 200 }),
    );
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('새것', undefined, 'google'));

    expect(result.current.components).toHaveLength(MAX_COMPONENTS);
    expect(result.current.components[0].prompt).toBe('새것');
    expect(result.current.components.map((c) => c.id)).not.toContain(`old-${MAX_COMPONENTS - 1}`);
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
