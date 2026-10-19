import { useState, useEffect } from 'react';

function read<T>(key: string, initial: T, revive?: (raw: unknown) => T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return initial;
    const parsed: unknown = JSON.parse(stored);
    return revive ? revive(parsed) : (parsed as T);
  } catch {
    return initial;
  }
}

// localStorage와 동기화되는 상태. 저장소 접근이 막혀도 메모리 상태로 계속 동작한다.
export function usePersistentState<T>(
  key: string,
  initial: T,
  revive?: (raw: unknown) => T,
) {
  const [value, setValue] = useState<T>(() => read(key, initial, revive));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 용량 초과·비공개 모드 등은 무시한다.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
