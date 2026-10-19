import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useApiKeys } from './useApiKeys';

const KEYS = 'rcg:apiKeys';
const REMEMBER = 'rcg:rememberKeys';

describe('useApiKeys', () => {
  beforeEach(() => localStorage.clear());

  it('기본값은 저장하지 않음이라 키를 입력해도 localStorage에 쓰지 않는다', () => {
    const { result } = renderHook(() => useApiKeys());
    act(() => result.current.setApiKey('google', 'AIza-secret'));

    expect(result.current.apiKeys.google).toBe('AIza-secret');
    expect(localStorage.getItem(KEYS)).toBeNull();
  });

  it('저장 옵션을 켜면 키를 localStorage에 저장한다', () => {
    const { result } = renderHook(() => useApiKeys());
    act(() => result.current.setRemember(true));
    act(() => result.current.setApiKey('google', 'AIza-secret'));

    expect(JSON.parse(localStorage.getItem(KEYS) ?? '{}').google).toBe('AIza-secret');
  });

  it('저장 옵션이 켜져 있으면 새로고침 후 키를 복원한다', () => {
    localStorage.setItem(REMEMBER, 'true');
    localStorage.setItem(KEYS, JSON.stringify({ anthropic: 'sk-ant-x', google: '' }));
    const { result } = renderHook(() => useApiKeys());

    expect(result.current.apiKeys.anthropic).toBe('sk-ant-x');
  });

  it('저장 옵션이 꺼져 있으면 남아 있는 키도 복원하지 않는다', () => {
    localStorage.setItem(KEYS, JSON.stringify({ anthropic: 'sk-ant-x', google: '' }));
    const { result } = renderHook(() => useApiKeys());

    expect(result.current.apiKeys.anthropic).toBe('');
  });

  it('저장 옵션을 끄면 저장된 키를 지운다', () => {
    const { result } = renderHook(() => useApiKeys());
    act(() => result.current.setRemember(true));
    act(() => result.current.setApiKey('google', 'AIza-secret'));
    act(() => result.current.setRemember(false));

    expect(localStorage.getItem(KEYS)).toBeNull();
    expect(result.current.apiKeys.google).toBe('AIza-secret');
  });

  it('문자열이 아닌 저장 값은 빈 문자열로 처리한다', () => {
    localStorage.setItem(REMEMBER, 'true');
    localStorage.setItem(KEYS, JSON.stringify({ anthropic: 123, google: ['x'] }));
    const { result } = renderHook(() => useApiKeys());

    expect(result.current.apiKeys).toEqual({ anthropic: '', google: '' });
  });
});
