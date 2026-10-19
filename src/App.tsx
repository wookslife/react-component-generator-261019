import { useState, useEffect } from 'react';
import { usePersistentState } from './hooks/usePersistentState';
import { useApiKeys } from './hooks/useApiKeys';
import { addToHistory } from './utils/promptHistory';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const { apiKeys, setApiKey, remember, setRemember } = useApiKeys();
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = usePersistentState<Provider>(
    'rcg:provider',
    'google',
    (raw) => (raw === 'anthropic' || raw === 'google' ? raw : 'google'),
  );
  const [promptHistory, setPromptHistory] = usePersistentState<string[]>(
    'rcg:promptHistory',
    [],
    (raw) => (Array.isArray(raw) ? raw.filter((p) => typeof p === 'string') : []),
  );
  const apiKey = apiKeys[provider];
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    setPromptHistory((prev) => addToHistory(prev, prompt));
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <header className="menubar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">RC</span>
          <span className="brand-name">React Component Generator</span>
        </div>
        <div className="menubar-status" aria-label="현재 작업 상태">
          <div>
            <span>Provider</span>
            <strong>{activeProvider}</strong>
          </div>
          <div>
            <span>컴포넌트</span>
            <strong>{components.length}</strong>
          </div>
        </div>
      </header>

      <div className="intro">
        <h1>프롬프트로 만드는 UI 워크벤치</h1>
        <p>만들고 싶은 화면을 글로 적으면, React 컴포넌트가 바로 미리보기와 코드로 나옵니다.</p>
      </div>

      <main className="workspace">
        <section className="window" aria-labelledby="composer-title">
          <div className="titlebar">
            <span className="titlebar-box" aria-hidden="true" />
            <h2 className="titlebar-title" id="composer-title">새 컴포넌트</h2>
          </div>
          <div className="window-body">
            <PromptInput
              onGenerate={handleGenerate}
              isLoading={isLoading}
              history={promptHistory}
            />
          </div>
        </section>

        <aside className="window" aria-labelledby="settings-title">
          <div className="titlebar">
            <span className="titlebar-box" aria-hidden="true" />
            <h2 className="titlebar-title" id="settings-title">실행 설정</h2>
          </div>
          <div className="window-body">
            <div className="provider-select">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => handleProviderChange(e.target.value as Provider)}
              >
                {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="api-key-input">
              <label htmlFor="api-key">API Key</label>
              <div className="api-key-field">
                <input
                  id="api-key"
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(provider, e.target.value)}
                  placeholder={
                    hasEnvKey
                      ? '서버 키 사용 중 (직접 입력으로 덮어쓰기 가능)'
                      : PROVIDER_CONFIG[provider].placeholder
                  }
                />
                <button
                  className="btn-toggle-key"
                  onClick={() => setShowKey(!showKey)}
                  type="button"
                >
                  {showKey ? '숨기기' : '보기'}
                </button>
              </div>
              <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
                {hasEnvKey ? '.env 키가 연결되어 있습니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
              </p>
              <label className="key-remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                이 브라우저에 API 키 저장
              </label>
              {remember && (
                <p className="key-status">
                  키가 평문으로 저장됩니다. 공용 PC에서는 사용하지 마세요.
                </p>
              )}
            </div>
          </div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section" aria-label="생성 결과">
        {components.length > 0 && (
          <div className="results-header">
            <h2>생성된 컴포넌트</h2>
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
          </div>
        )}

        {components.length === 0 && !isLoading && (
          <div className="window empty-state">
            <div className="titlebar">
              <span className="titlebar-box" aria-hidden="true" />
              <h2 className="titlebar-title">결과 없음</h2>
            </div>
            <div className="empty-body">
              <div className="empty-copy">
                <h2>새 컴포넌트를 생성해보세요.</h2>
                <p>
                  위 창에 만들고 싶은 UI를 적고 <kbd>Ctrl</kbd> + <kbd>Enter</kbd>를 누르세요.
                  예시 프롬프트를 눌러 시작해도 됩니다.
                </p>
              </div>
              <div className="empty-preview" aria-hidden="true">
                <div className="empty-window">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="empty-canvas">
                  <div className="empty-card empty-card--primary" />
                  <div className="empty-card" />
                  <div className="empty-card empty-card--wide" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="window loading-card" role="status">
            <div className="titlebar">
              <span className="titlebar-box" aria-hidden="true" />
              <h2 className="titlebar-title">생성 중</h2>
            </div>
            <div className="window-body">
              <p>컴포넌트를 생성하고 있습니다...</p>
              <div className="loading-bar" aria-hidden="true">
                <div className="loading-bar-fill" />
              </div>
            </div>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
