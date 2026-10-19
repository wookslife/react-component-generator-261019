import { describe, it, expect } from 'vitest';
import { addToHistory, MAX_HISTORY } from './promptHistory';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('중복 프롬프트는 기존 항목을 지우고 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b'], 'b')).toEqual(['b', 'a']);
  });

  it('최대 개수를 넘으면 가장 오래된 항목을 버린다', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });
});
