import { useState, useEffect, useCallback } from 'react';
import type { Provider } from '../types';
import { usePersistentState } from './usePersistentState';

const KEYS_KEY = 'rcg:apiKeys';
const REMEMBER_KEY = 'rcg:rememberKeys';

type ApiKeys = Record<Provider, string>;

const EMPTY_KEYS: ApiKeys = { anthropic: '', google: '' };

function readStoredKeys(): ApiKeys {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEYS_KEY) ?? 'null');
    if (typeof parsed !== 'object' || parsed === null) return EMPTY_KEYS;
    const raw = parsed as Record<string, unknown>;
    return {
      anthropic: typeof raw.anthropic === 'string' ? raw.anthropic : '',
      google: typeof raw.google === 'string' ? raw.google : '',
    };
  } catch {
    return EMPTY_KEYS;
  }
}

// 생성된 코드가 같은 origin에서 실행되므로, 키는 사용자가 명시적으로 켠 경우에만 저장한다.
export function useApiKeys() {
  const [remember, setRemember] = usePersistentState<boolean>(REMEMBER_KEY, false, (raw) => raw === true);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() =>
    remember ? readStoredKeys() : EMPTY_KEYS,
  );

  useEffect(() => {
    try {
      if (remember) {
        localStorage.setItem(KEYS_KEY, JSON.stringify(apiKeys));
      } else {
        localStorage.removeItem(KEYS_KEY);
      }
    } catch {
      // 저장소 접근 실패는 무시한다.
    }
  }, [remember, apiKeys]);

  const setApiKey = useCallback((provider: Provider, value: string) => {
    setApiKeys((prev) => ({ ...prev, [provider]: value }));
  }, []);

  return { apiKeys, setApiKey, remember, setRemember };
}
