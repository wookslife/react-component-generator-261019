# server/AGENTS.md

## Module Context

Bun 런타임에서 실행되는 AI 프로바이더 프록시. Vite dev 서버가 `/api`를 이 서버(3002)로 프록시한다. 프론트엔드(`src/`)와 코드를 공유하지 않는다.

## Tech Stack & Constraints

- 런타임은 Bun (`Bun.serve`, `process.env`). 외부 SDK 없이 `fetch`로 직접 호출한다. SDK나 axios를 추가하지 않는다.
- Node 전용 API에 의존하지 않는다. 서버 진입점은 `bun --watch run server/index.ts`로 실행된다.

## Implementation Patterns

- 프로바이더별 호출 함수는 `callAnthropic`, `callGoogleModel`처럼 `(prompt, apiKey, ...) => Promise<string>` 시그니처로 응답 텍스트만 반환한다. 코드 정규화는 호출부에서 `ensureRenderCall(stripCodeFences(text))`로 한 번만 한다 (`index.ts:188`).
- 모델 폴백이 필요하면 `withModelFallback(models, attempt)`를 쓴다 (`fallback.ts`). Google은 `GOOGLE_MODELS` 순서대로 시도한다 (`index.ts:5`).
- 모든 응답에 `CORS_HEADERS`를 붙인다 (`index.ts:51-55`). 새 라우트나 새 에러 응답에서도 빠뜨리지 않는다.
- API 키 해석 우선순위는 클라이언트 입력 > 환경변수다 (`resolveApiKey`, `index.ts:64-66`).

## Testing Strategy

```bash
bun run test            # 루트에서 실행. server/**/*.test.ts 포함
```

- `index.ts`는 import 시점에 서버가 뜨므로 테스트에서 import하지 않는다. 테스트할 로직은 `generator.ts`처럼 부수효과 없는 모듈로 분리한다.
- 테스트 파일은 대상 옆에 `<name>.test.ts`로 둔다.

## Local Golden Rules

- Anthropic 경로와 Google 경로는 비대칭이다. Google에만 모델 폴백(`index.ts:134-136`)과 `MAX_TOKENS` 절단 감지(`index.ts:123-125`)가 있고, Anthropic에는 둘 다 없다 (`index.ts:68-96`). 같은 보호가 필요하면 의도적으로 추가하고, 한쪽만 고친 채 두지 않는다.
- Anthropic은 `max_tokens: 4096`, Google은 `maxOutputTokens: 8192`로 한도가 다르다 (`index.ts:78`, `index.ts:107`). 긴 컴포넌트가 Anthropic에서 먼저 잘린다.
- 서버 기본 provider는 `anthropic`이지만 (`index.ts:161`) UI 기본값은 `google`이다 (`src/App.tsx:16`). 훅이 항상 provider를 보내므로 실제 충돌은 없다. 둘 중 하나를 바꾸면 다른 쪽과의 의도를 확인한다.
- 에러 매핑은 `err.message.includes('503' | '429')`에 의존한다 (`index.ts:194-206`). 폴백이 모두 실패하면 마지막 에러만 던져지므로 (`fallback.ts:19`) 앞선 모델의 에러 코드는 사용자에게 보이지 않는다.
- 서버가 반환하는 `error` 문자열은 UI 배너에 그대로 표시된다 (`src/hooks/useComponentGenerator.ts:32`). 키, URL, 내부 스택을 포함하지 않는다.
